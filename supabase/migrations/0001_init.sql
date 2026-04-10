-- TrendPulse — initial schema
-- Tables, enums, and RLS policies for the MVP.
-- See /Users/octavioecheverri/.claude/plans/mellow-twirling-robin.md for rationale.

-- ============================================================================
-- Enums
-- ============================================================================

create type piece_category as enum (
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'bag',
  'accessory',
  'jewelry',
  'headwear'
);

create type media_type as enum ('photo', 'embed');
create type embed_provider as enum ('instagram', 'tiktok');
create type content_status as enum ('pending', 'approved', 'rejected');
create type user_role as enum ('user', 'moderator', 'admin');
create type vote_target as enum ('piece', 'outfit');

-- ============================================================================
-- Cities
-- ============================================================================

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_i18n jsonb not null default '{}'::jsonb,
  country_code text not null,
  official_languages text[] not null default '{}',
  default_language text not null,
  timezone text not null,
  lat numeric(9, 6),
  lng numeric(9, 6),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index cities_slug_idx on public.cities (slug);
create index cities_country_code_idx on public.cities (country_code);

-- ============================================================================
-- Users (extends auth.users)
-- ============================================================================

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  home_city_id uuid references public.cities (id) on delete set null,
  trust_score integer not null default 0,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index users_handle_idx on public.users (handle);
create index users_role_idx on public.users (role);

-- Trigger: auto-create public.users row when auth.users row is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Pieces
-- ============================================================================

create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users (id) on delete set null,
  title text not null,
  description text,
  category piece_category not null,
  city_id uuid not null references public.cities (id) on delete restrict,
  media_type media_type not null,
  photo_url text,
  embed_url text,
  embed_provider embed_provider,
  affiliate_url text,
  status content_status not null default 'pending',
  rejected_reason text,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz,

  constraint pieces_media_check check (
    (media_type = 'photo' and photo_url is not null)
    or (media_type = 'embed' and embed_url is not null and embed_provider is not null)
  )
);

create index pieces_status_city_idx on public.pieces (status, city_id);
create index pieces_approved_at_idx on public.pieces (approved_at desc) where status = 'approved';
create index pieces_author_idx on public.pieces (author_id);

-- ============================================================================
-- Outfits
-- ============================================================================

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users (id) on delete set null,
  title text not null,
  description text,
  city_id uuid not null references public.cities (id) on delete restrict,
  photo_url text not null,
  status content_status not null default 'pending',
  rejected_reason text,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index outfits_status_city_idx on public.outfits (status, city_id);
create index outfits_approved_at_idx on public.outfits (approved_at desc) where status = 'approved';

-- Outfit ↔ piece tags
create table public.outfit_pieces (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  piece_id uuid not null references public.pieces (id) on delete cascade,
  primary key (outfit_id, piece_id)
);

-- ============================================================================
-- Votes
-- ============================================================================

create table public.votes (
  user_id uuid not null references public.users (id) on delete cascade,
  target_type vote_target not null,
  target_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index votes_target_idx on public.votes (target_type, target_id);

-- ============================================================================
-- Newsletter cache (optional — mirrors Beehiiv)
-- ============================================================================

create table public.newsletter_subscribers (
  email text primary key,
  locale text not null,
  subscribed_at timestamptz not null default now()
);

-- ============================================================================
-- Premium waitlist
-- ============================================================================

create table public.premium_waitlist (
  user_id uuid primary key references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RLS — Row Level Security
-- ============================================================================

alter table public.cities enable row level security;
alter table public.users enable row level security;
alter table public.pieces enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_pieces enable row level security;
alter table public.votes enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.premium_waitlist enable row level security;

-- Cities: public read, admin write
create policy "cities_select_all"
  on public.cities for select
  using (true);

create policy "cities_write_admin"
  on public.cities for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin')
    )
  );

-- Users: public reads of non-sensitive fields via view; owners can update self
create policy "users_select_all"
  on public.users for select
  using (deleted_at is null);

create policy "users_update_self"
  on public.users for update
  using (id = auth.uid());

-- Pieces: approved are public; pending only visible to author + moderators
create policy "pieces_select_approved"
  on public.pieces for select
  using (status = 'approved');

create policy "pieces_select_own_or_mod"
  on public.pieces for select
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

create policy "pieces_insert_authenticated"
  on public.pieces for insert
  with check (author_id = auth.uid());

create policy "pieces_update_own_or_mod"
  on public.pieces for update
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- Outfits: same as pieces
create policy "outfits_select_approved"
  on public.outfits for select
  using (status = 'approved');

create policy "outfits_select_own_or_mod"
  on public.outfits for select
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

create policy "outfits_insert_authenticated"
  on public.outfits for insert
  with check (author_id = auth.uid());

create policy "outfits_update_own_or_mod"
  on public.outfits for update
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- Outfit pieces: readable if parent outfit readable; writable by outfit author
create policy "outfit_pieces_select"
  on public.outfit_pieces for select
  using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id
        and (
          o.status = 'approved'
          or o.author_id = auth.uid()
          or exists (
            select 1 from public.users
            where id = auth.uid() and role in ('moderator', 'admin')
          )
        )
    )
  );

create policy "outfit_pieces_insert_author"
  on public.outfit_pieces for insert
  with check (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id and o.author_id = auth.uid()
    )
  );

-- Votes: user can vote/unvote only for self
create policy "votes_select_own"
  on public.votes for select
  using (user_id = auth.uid());

create policy "votes_insert_self"
  on public.votes for insert
  with check (user_id = auth.uid());

create policy "votes_update_self"
  on public.votes for update
  using (user_id = auth.uid());

create policy "votes_delete_self"
  on public.votes for delete
  using (user_id = auth.uid());

-- Newsletter: public insert (anonymous); no select
create policy "newsletter_insert_all"
  on public.newsletter_subscribers for insert
  with check (true);

-- Premium waitlist: user can join for self, admin can read all
create policy "premium_waitlist_insert_self"
  on public.premium_waitlist for insert
  with check (user_id = auth.uid());

create policy "premium_waitlist_select_self"
  on public.premium_waitlist for select
  using (user_id = auth.uid());

create policy "premium_waitlist_select_admin"
  on public.premium_waitlist for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
