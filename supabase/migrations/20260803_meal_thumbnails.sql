-- Private meal thumbnails. Run this migration in the Supabase SQL editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-thumbnails', 'meal-thumbnails', false, 153600, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 153600, allowed_mime_types = array['image/jpeg'];

create policy "Users can read their meal thumbnails" on storage.objects for select to authenticated
using (bucket_id = 'meal-thumbnails' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can upload their meal thumbnails" on storage.objects for insert to authenticated
with check (bucket_id = 'meal-thumbnails' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can update their meal thumbnails" on storage.objects for update to authenticated
using (bucket_id = 'meal-thumbnails' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'meal-thumbnails' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can delete their meal thumbnails" on storage.objects for delete to authenticated
using (bucket_id = 'meal-thumbnails' and (storage.foldername(name))[1] = (select auth.uid()::text));
