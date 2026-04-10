-- TrendPulse RPC functions
-- - vote(): atomic upsert + counter update
-- - ranked_pieces() / ranked_outfits(): hot-score ranked feed (per-city or global)
-- - fresh_pieces() / fresh_outfits(): cold-start exposure pool

-- ============================================================================
-- vote() — atomic upsert into votes + recompute counters
-- ============================================================================

create or replace function public.vote(
  p_target_type vote_target,
  p_target_id uuid,
  p_value smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous smallint;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_value not in (-1, 0, 1) then
    raise exception 'value must be -1, 0, or 1';
  end if;

  select value into v_previous
  from public.votes
  where user_id = v_user_id and target_type = p_target_type and target_id = p_target_id;

  if p_value = 0 then
    -- Remove vote
    delete from public.votes
    where user_id = v_user_id and target_type = p_target_type and target_id = p_target_id;
  else
    insert into public.votes (user_id, target_type, target_id, value)
    values (v_user_id, p_target_type, p_target_id, p_value)
    on conflict (user_id, target_type, target_id) do update set value = excluded.value;
  end if;

  -- Adjust counters
  if p_target_type = 'piece' then
    update public.pieces
    set
      upvotes = upvotes + case when p_value = 1 then 1 else 0 end - case when v_previous = 1 then 1 else 0 end,
      downvotes = downvotes + case when p_value = -1 then 1 else 0 end - case when v_previous = -1 then 1 else 0 end
    where id = p_target_id;
  else
    update public.outfits
    set
      upvotes = upvotes + case when p_value = 1 then 1 else 0 end - case when v_previous = 1 then 1 else 0 end,
      downvotes = downvotes + case when p_value = -1 then 1 else 0 end - case when v_previous = -1 then 1 else 0 end
    where id = p_target_id;
  end if;
end;
$$;

grant execute on function public.vote(vote_target, uuid, smallint) to authenticated;

-- ============================================================================
-- Hot score helpers
-- ============================================================================

create or replace function public.hot_score(
  p_upvotes integer,
  p_downvotes integer,
  p_approved_at timestamptz
)
returns double precision
language sql
immutable
as $$
  select greatest(p_upvotes - p_downvotes, 0)::double precision
    / power(
        extract(epoch from (now() - p_approved_at)) / 3600 + 2,
        1.5
      );
$$;

-- ============================================================================
-- ranked_pieces() / ranked_outfits()
-- ============================================================================

create or replace function public.ranked_pieces(
  p_city_slug text default null,
  p_limit integer default 40
)
returns setof public.pieces
language sql
stable
as $$
  select p.*
  from public.pieces p
  join public.cities c on c.id = p.city_id
  where p.status = 'approved'
    and (p_city_slug is null or c.slug = p_city_slug)
  order by public.hot_score(p.upvotes, p.downvotes, p.approved_at) desc
  limit p_limit;
$$;

create or replace function public.ranked_outfits(
  p_city_slug text default null,
  p_limit integer default 40
)
returns setof public.outfits
language sql
stable
as $$
  select o.*
  from public.outfits o
  join public.cities c on c.id = o.city_id
  where o.status = 'approved'
    and (p_city_slug is null or c.slug = p_city_slug)
  order by public.hot_score(o.upvotes, o.downvotes, o.approved_at) desc
  limit p_limit;
$$;

-- ============================================================================
-- fresh_pieces() / fresh_outfits() — cold-start pool for slot injection
-- ============================================================================

create or replace function public.fresh_pieces(
  p_city_slug text default null,
  p_limit integer default 10
)
returns setof public.pieces
language sql
stable
as $$
  select p.*
  from public.pieces p
  join public.cities c on c.id = p.city_id
  where p.status = 'approved'
    and (p_city_slug is null or c.slug = p_city_slug)
    and p.approved_at > now() - interval '24 hours'
    and (p.upvotes + p.downvotes) < 3
  order by random()
  limit p_limit;
$$;

create or replace function public.fresh_outfits(
  p_city_slug text default null,
  p_limit integer default 10
)
returns setof public.outfits
language sql
stable
as $$
  select o.*
  from public.outfits o
  join public.cities c on c.id = o.city_id
  where o.status = 'approved'
    and (p_city_slug is null or c.slug = p_city_slug)
    and o.approved_at > now() - interval '24 hours'
    and (o.upvotes + o.downvotes) < 3
  order by random()
  limit p_limit;
$$;

grant execute on function public.ranked_pieces(text, integer) to anon, authenticated;
grant execute on function public.ranked_outfits(text, integer) to anon, authenticated;
grant execute on function public.fresh_pieces(text, integer) to anon, authenticated;
grant execute on function public.fresh_outfits(text, integer) to anon, authenticated;
