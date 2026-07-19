alter table public.payment_proofs
add column if not exists acknowledgement_number text null,
add column if not exists acknowledgement_pdf_path text null;

create unique index if not exists payment_proofs_acknowledgement_number_idx
  on public.payment_proofs (acknowledgement_number)
  where acknowledgement_number is not null;

create index if not exists payment_proofs_acknowledgement_pdf_path_idx
  on public.payment_proofs (acknowledgement_pdf_path)
  where acknowledgement_pdf_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('payment-acknowledgements', 'payment-acknowledgements', false, 2 * 1024 * 1024, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read payment acknowledgements" on storage.objects;
create policy "Admins can read payment acknowledgements"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-acknowledgements' and public.is_admin());

create or replace function public.submit_payment_proof_record(
  p_registration_id text,
  p_payment_access_token_hash text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes integer,
  p_acknowledgement_number text,
  p_acknowledgement_pdf_path text,
  p_submitted_at timestamptz
)
returns table(
  registration_id text,
  registration_status public.registration_status,
  payment_status public.payment_status,
  submitted_at timestamptz,
  acknowledgement_number text,
  acknowledgement_pdf_path text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_acknowledgement_number text;
  v_acknowledgement_pdf_path text;
  v_registration public.registrations%rowtype;
  v_payment_proof_id uuid;
  v_submitted_at timestamptz;
begin
  v_acknowledgement_number := nullif(btrim(coalesce(p_acknowledgement_number, '')), '');
  v_acknowledgement_pdf_path := nullif(btrim(coalesce(p_acknowledgement_pdf_path, '')), '');
  v_submitted_at := coalesce(p_submitted_at, now());

  if v_acknowledgement_number is null or v_acknowledgement_pdf_path is null then
    raise exception 'acknowledgement metadata required' using errcode = '23502';
  end if;

  select *
  into v_registration
  from public.registrations
  where registrations.registration_id = p_registration_id
    and registrations.payment_access_token_hash = p_payment_access_token_hash
    and registrations.payment_access_token_expires_at > now()
  for update;

  if not found then
    raise exception 'payment token invalid' using errcode = '28000';
  end if;

  if not (
    v_registration.payment_status = 'not_submitted'
    or (
      v_registration.payment_status = 'rejected'
      and v_registration.payment_resubmission_allowed = true
    )
  ) then
    raise exception 'payment submission not allowed' using errcode = 'P0001';
  end if;

  v_payment_proof_id := gen_random_uuid();

  insert into public.payment_proofs (
    id,
    registration_record_id,
    storage_path,
    original_filename,
    mime_type,
    size_bytes,
    proof_status,
    acknowledgement_number,
    acknowledgement_pdf_path,
    submitted_at
  )
  values (
    v_payment_proof_id,
    v_registration.id,
    p_storage_path,
    p_original_filename,
    p_mime_type,
    p_size_bytes,
    'pending_verification',
    v_acknowledgement_number,
    v_acknowledgement_pdf_path,
    v_submitted_at
  );

  update public.registrations
  set
    registration_status = 'submitted',
    payment_status = 'pending_verification',
    payment_submitted_at = v_submitted_at,
    payment_resubmission_allowed = false,
    public_rejection_message = null,
    version = version + 1
  where id = v_registration.id
  returning
    registrations.registration_id,
    registrations.registration_status,
    registrations.payment_status,
    registrations.payment_submitted_at
  into registration_id, registration_status, payment_status, submitted_at;

  acknowledgement_number := v_acknowledgement_number;
  acknowledgement_pdf_path := v_acknowledgement_pdf_path;
  return next;
end;
$$;

revoke all on function public.submit_payment_proof_record(text, text, text, text, text, integer, text, text, timestamptz) from anon, authenticated;
