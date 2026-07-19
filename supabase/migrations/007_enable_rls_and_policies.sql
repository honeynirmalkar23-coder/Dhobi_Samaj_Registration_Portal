alter table public.registration_counters enable row level security;
alter table public.registrations enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.payment_settings enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.public_request_rate_limits enable row level security;

drop policy if exists "Admins can select registrations" on public.registrations;
create policy "Admins can select registrations"
on public.registrations
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can select payment proofs" on public.payment_proofs;
create policy "Admins can select payment proofs"
on public.payment_proofs
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can select payment settings" on public.payment_settings;
create policy "Admins can select payment settings"
on public.payment_settings
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can select audit logs" on public.admin_audit_logs;
create policy "Admins can select audit logs"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

revoke all on public.registration_counters from anon, authenticated;
revoke all on public.public_request_rate_limits from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.registrations to authenticated;
grant select on public.payment_proofs to authenticated;
grant select on public.payment_settings to authenticated;
grant select on public.admin_audit_logs to authenticated;

grant execute on function public.get_public_registration_status(text) to anon, authenticated;
grant execute on function public.admin_save_payment_settings(boolean, text, text, text, numeric, text, text, text, timestamptz) to authenticated;
grant execute on function public.admin_dashboard_metrics() to authenticated;
grant execute on function public.admin_list_registrations(text, public.registration_status, public.payment_status, date, text, integer, integer) to authenticated;
grant execute on function public.admin_get_registration_details(text) to authenticated;
grant execute on function public.admin_update_registration_state(text, integer, text, text) to authenticated;
grant execute on function public.admin_update_notes(text, integer, text) to authenticated;
grant execute on function public.admin_audit_log_entries(text, text, date, date, integer, integer) to authenticated;
