alter table public.registrations
add column if not exists mobile_number text null;

alter table public.registrations
drop constraint if exists registrations_mobile_number_format;

alter table public.registrations
add constraint registrations_mobile_number_format check (
  mobile_number is null or mobile_number ~ '^[6-9][0-9]{9}$'
);

drop function if exists public.create_registration_record(
  text,
  smallint,
  text,
  text,
  text,
  smallint,
  smallint,
  smallint,
  text,
  text,
  timestamptz
);

create or replace function public.create_registration_record(
  p_full_name text,
  p_age smallint,
  p_mobile_number text,
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
    mobile_number,
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
    btrim(p_mobile_number),
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

revoke all on function public.create_registration_record(
  text,
  smallint,
  text,
  text,
  text,
  text,
  smallint,
  smallint,
  smallint,
  text,
  text,
  timestamptz
) from anon, authenticated;

drop function if exists public.admin_export_registrations();

create or replace function public.admin_export_registrations()
returns table(
  registration_id text,
  full_name text,
  mobile_number text,
  dob text,
  age smallint,
  education text,
  address text,
  boys smallint,
  girls smallint,
  elderly smallint,
  payment_status public.payment_status,
  payment_reference text,
  payment_utr text,
  payment_amount numeric,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  return query
  select
    r.registration_id,
    r.full_name,
    r.mobile_number,
    null::text as dob,
    r.age,
    r.education_level as education,
    r.permanent_address as address,
    r.boys_count as boys,
    r.girls_count as girls,
    r.elders_count as elderly,
    r.payment_status,
    null::text as payment_reference,
    null::text as payment_utr,
    ps.amount as payment_amount,
    r.created_at,
    r.updated_at
  from public.registrations r
  left join public.payment_settings ps on ps.id = 1
  order by r.created_at asc, r.registration_id asc;
end;
$$;

create or replace function public.admin_get_registration_details(p_registration_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.registrations%rowtype;
  v_payment_proofs jsonb;
begin
  perform public.assert_admin();

  select *
  into v_registration
  from public.registrations
  where registration_id = p_registration_id;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pp.id,
    'storagePath', pp.storage_path,
    'originalFilename', pp.original_filename,
    'mimeType', pp.mime_type,
    'sizeBytes', pp.size_bytes,
    'proofStatus', pp.proof_status,
    'publicRejectionMessage', pp.public_rejection_message,
    'reviewedAt', pp.reviewed_at,
    'submittedAt', pp.submitted_at
  ) order by pp.submitted_at desc), '[]'::jsonb)
  into v_payment_proofs
  from public.payment_proofs pp
  where pp.registration_record_id = v_registration.id;

  return jsonb_build_object(
    'registrationId', v_registration.registration_id,
    'fullName', v_registration.full_name,
    'age', v_registration.age,
    'mobileNumber', v_registration.mobile_number,
    'educationLevel', v_registration.education_level,
    'educationDetails', v_registration.education_details,
    'permanentAddress', v_registration.permanent_address,
    'boysCount', v_registration.boys_count,
    'girlsCount', v_registration.girls_count,
    'eldersCount', v_registration.elders_count,
    'totalFamilyMembers', v_registration.total_family_members,
    'registrationStatus', v_registration.registration_status,
    'paymentStatus', v_registration.payment_status,
    'paymentResubmissionAllowed', v_registration.payment_resubmission_allowed,
    'publicRejectionMessage', v_registration.public_rejection_message,
    'adminNotes', v_registration.admin_notes,
    'applicantPhotoPath', v_registration.applicant_photo_path,
    'paymentSubmittedAt', v_registration.payment_submitted_at,
    'paymentVerifiedAt', v_registration.payment_verified_at,
    'reviewedAt', v_registration.reviewed_at,
    'approvedAt', v_registration.approved_at,
    'rejectedAt', v_registration.rejected_at,
    'archivedAt', v_registration.archived_at,
    'createdAt', v_registration.created_at,
    'updatedAt', v_registration.updated_at,
    'version', v_registration.version,
    'paymentProofs', v_payment_proofs
  );
end;
$$;
