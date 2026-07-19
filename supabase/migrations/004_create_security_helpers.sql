create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.sha256_hex(value text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(value, 'sha256'), 'hex');
$$;

create or replace function public.assert_admin()
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.consume_public_rate_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, window_started_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_started_at timestamptz;
  v_count integer;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'invalid rate limit configuration';
  end if;

  v_window_started_at :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.public_request_rate_limits (
    key_hash,
    action,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_key_hash,
    p_action,
    v_window_started_at,
    1,
    now()
  )
  on conflict (key_hash, action, window_started_at)
  do update set
    request_count = public.public_request_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  window_started_at := v_window_started_at;
  return next;
end;
$$;

create or replace function public.insert_admin_audit_log(
  p_action text,
  p_registration_record_id uuid default null,
  p_previous_value jsonb default null,
  p_new_value jsonb default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform public.assert_admin();

  insert into public.admin_audit_logs (
    admin_user_id,
    registration_record_id,
    action,
    previous_value,
    new_value,
    metadata
  )
  values (
    auth.uid(),
    p_registration_record_id,
    p_action,
    p_previous_value,
    p_new_value,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.consume_public_rate_limit(text, text, integer, integer) from anon, authenticated;
revoke all on function public.insert_admin_audit_log(text, uuid, jsonb, jsonb, jsonb) from anon, authenticated;
