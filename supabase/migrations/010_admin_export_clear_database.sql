alter table public.admin_audit_logs
drop constraint if exists admin_audit_logs_action;

alter table public.admin_audit_logs
add constraint admin_audit_logs_action check (
  action in (
    'payment_settings_updated',
    'payment_verified',
    'payment_rejected',
    'registration_marked_under_review',
    'registration_approved',
    'registration_rejected',
    'registration_archived',
    'payment_resubmission_enabled',
    'admin_note_updated',
    'EXPORT_AND_CLEAR_DATABASE'
  )
);

create or replace function public.admin_export_registrations()
returns table(
  registration_id text,
  full_name text,
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

create or replace function public.admin_export_clear_database(
  p_expected_exported_rows bigint,
  p_csv_filename text,
  p_client_ip text default null
)
returns table(
  success boolean,
  exported_rows bigint,
  deleted_rows bigint,
  filename text,
  failure_code text,
  failure_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text;
  v_deleted_related_audit_rows bigint := 0;
  v_failure_code text;
  v_failure_message text;
  v_payment_proof_rows bigint := 0;
  v_registration_rows bigint := 0;
begin
  perform public.assert_admin();

  v_admin_email := coalesce(auth.jwt() ->> 'email', 'unknown-admin');
  filename := btrim(coalesce(p_csv_filename, ''));

  if
    p_expected_exported_rows is null
    or p_expected_exported_rows < 0
    or p_expected_exported_rows > 1000000
    or filename !~ '^registrations_[0-9]{4}-[0-9]{2}-[0-9]{2}(_[0-9]{2}-[0-9]{2})?\.csv$'
  then
    perform public.insert_admin_audit_log(
      'EXPORT_AND_CLEAR_DATABASE',
      null,
      null,
      null,
      jsonb_build_object(
        'administratorEmail', v_admin_email,
        'csvFilename', nullif(filename, ''),
        'expectedExportedRows', p_expected_exported_rows,
        'failureCode', 'VALIDATION_ERROR',
        'ipAddress', p_client_ip,
        'success', false,
        'time', now()
      )
    );

    success := false;
    exported_rows := 0;
    deleted_rows := 0;
    failure_code := 'VALIDATION_ERROR';
    failure_message := 'invalid export clear request';
    return next;
    return;
  end if;

  begin
    lock table public.payment_proofs, public.registrations, public.registration_counters, public.admin_audit_logs
      in exclusive mode;

    select count(*)::bigint
    into v_registration_rows
    from public.registrations;

    if v_registration_rows <> p_expected_exported_rows then
      raise exception 'export row count changed' using errcode = '40001';
    end if;

    select count(*)::bigint
    into v_payment_proof_rows
    from public.payment_proofs;

    select count(*)::bigint
    into v_deleted_related_audit_rows
    from public.admin_audit_logs aal
    where aal.registration_record_id in (
      select r.id from public.registrations r
    );

    delete from public.admin_audit_logs
    where registration_record_id in (
      select r.id from public.registrations r
    );

    delete from public.payment_proofs where true;
    delete from public.registrations where true;
    delete from public.registration_counters where true;

    perform public.insert_admin_audit_log(
      'EXPORT_AND_CLEAR_DATABASE',
      null,
      null,
      null,
      jsonb_build_object(
        'administratorEmail', v_admin_email,
        'counterReset', true,
        'csvFilename', filename,
        'deletedPaymentProofs', v_payment_proof_rows,
        'deletedRelatedAuditLogs', v_deleted_related_audit_rows,
        'deletedRows', v_registration_rows,
        'exportedRows', v_registration_rows,
        'ipAddress', p_client_ip,
        'success', true,
        'time', now()
      )
    );

    success := true;
    exported_rows := v_registration_rows;
    deleted_rows := v_registration_rows;
    failure_code := null;
    failure_message := null;
    return next;
    return;
  exception
    when others then
      v_failure_code := sqlstate;
      v_failure_message := left(sqlerrm, 200);

      perform public.insert_admin_audit_log(
        'EXPORT_AND_CLEAR_DATABASE',
        null,
        null,
        null,
        jsonb_build_object(
          'administratorEmail', v_admin_email,
          'csvFilename', filename,
          'expectedExportedRows', p_expected_exported_rows,
          'exportedRows', v_registration_rows,
          'failureCode', v_failure_code,
          'failureMessage', v_failure_message,
          'ipAddress', p_client_ip,
          'success', false,
          'time', now()
        )
      );

      success := false;
      exported_rows := v_registration_rows;
      deleted_rows := 0;
      failure_code := v_failure_code;
      failure_message := v_failure_message;
      return next;
      return;
  end;
end;
$$;

revoke all on function public.admin_export_registrations() from anon, authenticated;
revoke all on function public.admin_export_clear_database(bigint, text, text) from anon, authenticated;

grant execute on function public.admin_export_registrations() to authenticated;
grant execute on function public.admin_export_clear_database(bigint, text, text) to authenticated;
