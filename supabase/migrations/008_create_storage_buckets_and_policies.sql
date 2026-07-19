insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('applicant-photos', 'applicant-photos', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-qr-codes', 'payment-qr-codes', false, 3 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read applicant photos" on storage.objects;
create policy "Admins can read applicant photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'applicant-photos' and public.is_admin());

drop policy if exists "Admins can read payment proofs" on storage.objects;
create policy "Admins can read payment proofs"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "Admins can read payment QR codes" on storage.objects;
create policy "Admins can read payment QR codes"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-qr-codes' and public.is_admin());

drop policy if exists "Admins can upload payment QR codes" on storage.objects;
create policy "Admins can upload payment QR codes"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'payment-qr-codes' and public.is_admin());

drop policy if exists "Admins can update payment QR codes" on storage.objects;
create policy "Admins can update payment QR codes"
on storage.objects
for update
to authenticated
using (bucket_id = 'payment-qr-codes' and public.is_admin())
with check (bucket_id = 'payment-qr-codes' and public.is_admin());

drop policy if exists "Admins can delete payment QR codes" on storage.objects;
create policy "Admins can delete payment QR codes"
on storage.objects
for delete
to authenticated
using (bucket_id = 'payment-qr-codes' and public.is_admin());
