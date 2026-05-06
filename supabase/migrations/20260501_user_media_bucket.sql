-- Storage bucket for user-submitted media (pieces + outfits).
-- Authenticated users may upload to their own folder; reads are public so feed images load.

insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', true)
on conflict (id) do nothing;

-- Read: anyone can read (public bucket also implies public URLs).
create policy "user-media: public read"
  on storage.objects for select
  using (bucket_id = 'user-media');

-- Insert: authenticated user can write into pieces/<uid>/* or outfits/<uid>/*.
create policy "user-media: own insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-media'
    and (
      name like 'pieces/' || auth.uid()::text || '/%'
      or name like 'outfits/' || auth.uid()::text || '/%'
    )
  );

-- Delete/update: only owner.
create policy "user-media: own update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-media'
    and (
      name like 'pieces/' || auth.uid()::text || '/%'
      or name like 'outfits/' || auth.uid()::text || '/%'
    )
  );

create policy "user-media: own delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-media'
    and (
      name like 'pieces/' || auth.uid()::text || '/%'
      or name like 'outfits/' || auth.uid()::text || '/%'
    )
  );
