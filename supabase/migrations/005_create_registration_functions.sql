create or replace function public.generate_registration_id()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_year integer;
  v_next bigint;
begin
  v_year := extract(year from timezone('Asia/Kolkata', now()))::integer;

  insert into public.registration_counters (registration_year, last_value, updated_at)
  values (v_year, 1, now())
  on conflict (registration_year)
  do update set
    last_value = public.registration_counters.last_value + 1,
    updated_at = now()
  returning last_value into v_next;

  return 'DS-' || v_year::text || '-' || lpad(v_next::text, 6, '0');
end;
$$;

create or replace function public.create_registration_record(
  p_full_name text,
  p_age smallint,
  p_education_level text,
  p_education_details text,
  p_permanent_address text,
  p_boys_count smallint,
  p_girls_count smallint,
  p_elders_count smallint,
  p_applicant_photo_path text,
  p_payment_access_token_hash text,
  p_payment_access_token_expires_at timestamptz
)
returns table(
  id uuid,
  registration_id text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_registration_id text;
begin
  v_registration_id := public.generate_registration_id();

  insert into public.registrations (
    registration_id,
    full_name,
    age,
    education_level,
    education_details,
    permanent_address,
    boys_count,
    girls_count,
    elders_count,
    applicant_photo_path,
    payment_access_token_hash,
    payment_access_token_expires_at
  )
  values (
    v_registration_id,
    btrim(p_full_name),
    p_age,
    btrim(p_education_level),
    nullif(btrim(coalesce(p_education_details, '')), ''),
    btrim(p_permanent_address),
    p_boys_count,
    p_girls_count,
    p_elders_count,
    p_applicant_photo_path,
    p_payment_access_token_hash,
    p_payment_access_token_expires_at
  )
  returning registrations.id, registrations.registration_id, registrations.created_at
  into id, registration_id, created_at;

  return next;
end;
$$;

create or replace function public.get_public_registration_status(p_registration_id text)
returns table(
  registration_id text,
  masked_name text,
  registration_created_at timestamptz,
  registration_status public.registration_status,
  payment_status public.payment_status,
  last_updated_at timestamptz,
  payment_resubmission_allowed boolean,
  public_rejection_message text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_record public.registrations%rowtype;
  v_chars text[];
begin
  select *
  into v_record
  from public.registrations r
  where r.registration_id = p_registration_id;

  if not found then
    return;
  end if;

  v_chars := regexp_split_to_array(v_record.full_name, '');

  return query
  select
    v_record.registration_id,
    case
      when char_length(v_record.full_name) <= 2 then left(v_record.full_name, 1) || '***'
      else left(v_record.full_name, 1) || repeat('*', greatest(char_length(v_record.full_name) - 2, 2)) || right(v_record.full_name, 1)
    end,
    v_record.created_at,
    v_record.registration_status,
    v_record.payment_status,
    v_record.updated_at,
    v_record.payment_resubmission_allowed,
    v_record.public_rejection_message;
end;
$$;

create or replace function public.submit_payment_proof_record(
  p_registration_id text,
  p_payment_access_token_hash text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes integer
)
returns table(
  registration_id text,
  registration_status public.registration_status,
  payment_status public.payment_status,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_registration public.registrations%rowtype;
  v_payment_proof_id uuid;
begin
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
    proof_status
  )
  values (
    v_payment_proof_id,
    v_registration.id,
    p_storage_path,
    p_original_filename,
    p_mime_type,
    p_size_bytes,
    'pending_verification'
  );

  update public.registrations
  set
    registration_status = 'submitted',
    payment_status = 'pending_verification',
    payment_submitted_at = now(),
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

  return next;
end;
$$;

revoke all on function public.generate_registration_id() from anon, authenticated;
revoke all on function public.create_registration_record(text, smallint, text, text, text, smallint, smallint, smallint, text, text, timestamptz) from anon, authenticated;
revoke all on function public.submit_payment_proof_record(text, text, text, text, text, integer) from anon, authenticated;
