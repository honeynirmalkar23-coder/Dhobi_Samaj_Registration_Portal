create or replace function public.admin_save_payment_settings(
  p_payment_enabled boolean,
  p_qr_code_path text,
  p_upi_id text,
  p_payee_name text,
  p_amount numeric,
  p_payment_title text,
  p_instructions text,
  p_public_contact text,
  p_payment_deadline timestamptz
)
returns table(
  payment_enabled boolean,
  qr_code_path text,
  upi_id text,
  payee_name text,
  amount numeric,
  payment_title text,
  instructions text,
  public_contact text,
  payment_deadline timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous jsonb;
  v_updated public.payment_settings%rowtype;
begin
  perform public.assert_admin();

  if p_payment_enabled and (
    nullif(btrim(coalesce(p_qr_code_path, '')), '') is null or
    nullif(btrim(coalesce(p_upi_id, '')), '') is null or
    p_upi_id !~ '^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$' or
    nullif(btrim(coalesce(p_payee_name, '')), '') is null or
    p_amount is null or p_amount <= 0 or p_amount > 100000 or
    nullif(btrim(coalesce(p_payment_title, '')), '') is null or
    nullif(btrim(coalesce(p_instructions, '')), '') is null or
    nullif(btrim(coalesce(p_public_contact, '')), '') is null
  ) then
    raise exception 'invalid enabled payment settings' using errcode = '23514';
  end if;

  select to_jsonb(ps)
  into v_previous
  from public.payment_settings ps
  where ps.id = 1
  for update;

  update public.payment_settings
  set
    payment_enabled = p_payment_enabled,
    qr_code_path = nullif(btrim(coalesce(p_qr_code_path, '')), ''),
    upi_id = nullif(btrim(coalesce(p_upi_id, '')), ''),
    payee_name = nullif(btrim(coalesce(p_payee_name, '')), ''),
    amount = p_amount,
    payment_title = nullif(btrim(coalesce(p_payment_title, '')), ''),
    instructions = nullif(btrim(coalesce(p_instructions, '')), ''),
    public_contact = nullif(btrim(coalesce(p_public_contact, '')), ''),
    payment_deadline = p_payment_deadline,
    updated_by = auth.uid()
  where id = 1
  returning * into v_updated;

  perform public.insert_admin_audit_log(
    'payment_settings_updated',
    null,
    v_previous - 'updated_by',
    to_jsonb(v_updated) - 'updated_by',
    jsonb_build_object('qr_changed', coalesce(v_previous ->> 'qr_code_path', '') <> coalesce(v_updated.qr_code_path, ''))
  );

  return query
  select
    v_updated.payment_enabled,
    v_updated.qr_code_path,
    v_updated.upi_id,
    v_updated.payee_name,
    v_updated.amount,
    v_updated.payment_title,
    v_updated.instructions,
    v_updated.public_contact,
    v_updated.payment_deadline,
    v_updated.updated_at;
end;
$$;

create or replace function public.admin_dashboard_metrics()
returns table(
  total_registrations bigint,
  awaiting_payment bigint,
  pending_verification bigint,
  approved_registrations bigint,
  rejected_registrations bigint,
  submitted_today bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today_start timestamptz;
  v_today_end timestamptz;
begin
  perform public.assert_admin();

  v_today_start := (date_trunc('day', timezone('Asia/Kolkata', now())) at time zone 'Asia/Kolkata');
  v_today_end := v_today_start + interval '1 day';

  return query
  select
    count(*)::bigint,
    count(*) filter (where registration_status = 'awaiting_payment')::bigint,
    count(*) filter (where payment_status = 'pending_verification')::bigint,
    count(*) filter (where registration_status = 'approved')::bigint,
    count(*) filter (where registration_status = 'rejected')::bigint,
    count(*) filter (where created_at >= v_today_start and created_at < v_today_end)::bigint
  from public.registrations;
end;
$$;

create or replace function public.admin_list_registrations(
  p_search text default null,
  p_registration_status public.registration_status default null,
  p_payment_status public.payment_status default null,
  p_created_on date default null,
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 20
)
returns table(
  registration_id text,
  full_name text,
  age smallint,
  education_level text,
  total_family_members smallint,
  registration_status public.registration_status,
  payment_status public.payment_status,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset integer;
  v_page_size integer;
begin
  perform public.assert_admin();

  v_page_size := least(greatest(coalesce(p_page_size, 20), 1), 100);
  v_offset := greatest(coalesce(p_page, 1) - 1, 0) * v_page_size;

  return query
  with filtered as (
    select r.*
    from public.registrations r
    where (p_search is null or btrim(p_search) = '' or r.registration_id ilike '%' || btrim(p_search) || '%' or r.full_name ilike '%' || btrim(p_search) || '%')
      and (p_registration_status is null or r.registration_status = p_registration_status)
      and (p_payment_status is null or r.payment_status = p_payment_status)
      and (
        p_created_on is null
        or (r.created_at >= (p_created_on::timestamp at time zone 'Asia/Kolkata')
          and r.created_at < ((p_created_on::timestamp + interval '1 day') at time zone 'Asia/Kolkata'))
      )
  )
  select
    filtered.registration_id,
    filtered.full_name,
    filtered.age,
    filtered.education_level,
    filtered.total_family_members,
    filtered.registration_status,
    filtered.payment_status,
    filtered.payment_submitted_at,
    filtered.created_at,
    filtered.updated_at,
    count(*) over ()::bigint as total_count
  from filtered
  order by
    case when p_sort = 'oldest' then filtered.created_at end asc,
    case when p_sort <> 'oldest' then filtered.created_at end desc
  limit v_page_size offset v_offset;
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

create or replace function public.admin_update_registration_state(
  p_registration_id text,
  p_expected_version integer,
  p_action text,
  p_public_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.registrations%rowtype;
  v_previous jsonb;
  v_latest_proof public.payment_proofs%rowtype;
begin
  perform public.assert_admin();

  select *
  into v_registration
  from public.registrations
  where registration_id = p_registration_id
  for update;

  if not found then
    raise exception 'registration not found' using errcode = 'P0002';
  end if;

  if v_registration.version <> p_expected_version then
    raise exception 'record version conflict' using errcode = '40001';
  end if;

  v_previous := jsonb_build_object(
    'registrationStatus', v_registration.registration_status,
    'paymentStatus', v_registration.payment_status,
    'paymentResubmissionAllowed', v_registration.payment_resubmission_allowed,
    'version', v_registration.version
  );

  select *
  into v_latest_proof
  from public.payment_proofs
  where registration_record_id = v_registration.id
  order by submitted_at desc
  limit 1
  for update;

  if p_action = 'mark_under_review' then
    if v_registration.registration_status not in ('submitted', 'awaiting_payment') then
      raise exception 'transition not allowed' using errcode = 'P0001';
    end if;

    update public.registrations
    set registration_status = 'under_review', reviewed_at = now(), version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('registration_marked_under_review', v_registration.id, v_previous, to_jsonb(v_registration), null);
  elsif p_action = 'verify_payment' then
    if v_latest_proof.id is null or v_latest_proof.proof_status <> 'pending_verification' then
      raise exception 'latest payment proof is not pending' using errcode = 'P0001';
    end if;

    update public.payment_proofs
    set proof_status = 'verified', reviewed_by = auth.uid(), reviewed_at = now(), public_rejection_message = null
    where id = v_latest_proof.id;

    update public.registrations
    set payment_status = 'verified', payment_verified_at = now(), public_rejection_message = null, payment_resubmission_allowed = false, version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('payment_verified', v_registration.id, v_previous, to_jsonb(v_registration), jsonb_build_object('paymentProofId', v_latest_proof.id));
  elsif p_action = 'reject_payment' then
    if v_latest_proof.id is null or v_latest_proof.proof_status <> 'pending_verification' then
      raise exception 'latest payment proof is not pending' using errcode = 'P0001';
    end if;
    if nullif(btrim(coalesce(p_public_message, '')), '') is null or char_length(p_public_message) > 500 then
      raise exception 'public-safe rejection reason required' using errcode = '23514';
    end if;

    update public.payment_proofs
    set proof_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), public_rejection_message = btrim(p_public_message)
    where id = v_latest_proof.id;

    update public.registrations
    set payment_status = 'rejected', public_rejection_message = btrim(p_public_message), payment_resubmission_allowed = false, version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('payment_rejected', v_registration.id, v_previous, to_jsonb(v_registration), jsonb_build_object('paymentProofId', v_latest_proof.id));
  elsif p_action = 'approve_registration' then
    if v_registration.payment_status <> 'verified' or v_registration.registration_status = 'archived' then
      raise exception 'approval requires verified payment and non-archived record' using errcode = 'P0001';
    end if;

    update public.registrations
    set registration_status = 'approved', approved_at = now(), payment_resubmission_allowed = false, version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('registration_approved', v_registration.id, v_previous, to_jsonb(v_registration), null);
  elsif p_action = 'reject_registration' then
    if nullif(btrim(coalesce(p_public_message, '')), '') is null or char_length(p_public_message) > 500 then
      raise exception 'public-safe rejection reason required' using errcode = '23514';
    end if;

    update public.registrations
    set registration_status = 'rejected', rejected_at = now(), public_rejection_message = btrim(p_public_message), version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('registration_rejected', v_registration.id, v_previous, to_jsonb(v_registration), null);
  elsif p_action = 'archive_registration' then
    update public.registrations
    set registration_status = 'archived', archived_at = now(), version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('registration_archived', v_registration.id, v_previous, to_jsonb(v_registration), null);
  elsif p_action = 'enable_payment_resubmission' then
    if v_registration.payment_status <> 'rejected' then
      raise exception 'payment must be rejected before resubmission is enabled' using errcode = 'P0001';
    end if;

    update public.registrations
    set payment_resubmission_allowed = true, version = version + 1
    where id = v_registration.id
    returning * into v_registration;

    perform public.insert_admin_audit_log('payment_resubmission_enabled', v_registration.id, v_previous, to_jsonb(v_registration), null);
  else
    raise exception 'unknown admin action' using errcode = '22023';
  end if;

  return public.admin_get_registration_details(v_registration.registration_id);
end;
$$;

create or replace function public.admin_update_notes(
  p_registration_id text,
  p_expected_version integer,
  p_admin_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.registrations%rowtype;
begin
  perform public.assert_admin();

  if p_admin_notes is not null and char_length(p_admin_notes) > 5000 then
    raise exception 'admin notes too long' using errcode = '23514';
  end if;

  select *
  into v_registration
  from public.registrations
  where registration_id = p_registration_id
  for update;

  if not found then
    raise exception 'registration not found' using errcode = 'P0002';
  end if;

  if v_registration.version <> p_expected_version then
    raise exception 'record version conflict' using errcode = '40001';
  end if;

  update public.registrations
  set admin_notes = nullif(btrim(coalesce(p_admin_notes, '')), ''), version = version + 1
  where id = v_registration.id
  returning * into v_registration;

  perform public.insert_admin_audit_log(
    'admin_note_updated',
    v_registration.id,
    jsonb_build_object('notesChanged', true),
    jsonb_build_object('notesChanged', true),
    null
  );

  return public.admin_get_registration_details(v_registration.registration_id);
end;
$$;

create or replace function public.admin_audit_log_entries(
  p_action text default null,
  p_registration_id text default null,
  p_from date default null,
  p_to date default null,
  p_page integer default 1,
  p_page_size integer default 20
)
returns table(
  id uuid,
  admin_user_id uuid,
  action text,
  registration_id text,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page_size integer;
  v_offset integer;
begin
  perform public.assert_admin();

  v_page_size := least(greatest(coalesce(p_page_size, 20), 1), 100);
  v_offset := greatest(coalesce(p_page, 1) - 1, 0) * v_page_size;

  return query
  with filtered as (
    select aal.*, r.registration_id
    from public.admin_audit_logs aal
    left join public.registrations r on r.id = aal.registration_record_id
    where (p_action is null or aal.action = p_action)
      and (p_registration_id is null or r.registration_id = p_registration_id)
      and (p_from is null or aal.created_at >= (p_from::timestamp at time zone 'Asia/Kolkata'))
      and (p_to is null or aal.created_at < ((p_to::timestamp + interval '1 day') at time zone 'Asia/Kolkata'))
  )
  select
    filtered.id,
    filtered.admin_user_id,
    filtered.action,
    filtered.registration_id,
    filtered.metadata,
    filtered.created_at,
    count(*) over ()::bigint
  from filtered
  order by filtered.created_at desc
  limit v_page_size offset v_offset;
end;
$$;
