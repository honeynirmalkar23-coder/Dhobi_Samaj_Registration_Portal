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
  on conflict on constraint public_request_rate_limits_pkey
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
