create index if not exists registrations_registration_id_idx
  on public.registrations (registration_id);

create index if not exists registrations_created_at_idx
  on public.registrations (created_at desc);

create index if not exists registrations_updated_at_idx
  on public.registrations (updated_at desc);

create index if not exists registrations_registration_status_idx
  on public.registrations (registration_status);

create index if not exists registrations_payment_status_idx
  on public.registrations (payment_status);

create index if not exists registrations_full_name_idx
  on public.registrations using gin (to_tsvector('simple', full_name));

create index if not exists payment_proofs_registration_record_id_idx
  on public.payment_proofs (registration_record_id);

create index if not exists payment_proofs_submitted_at_idx
  on public.payment_proofs (submitted_at desc);

create index if not exists payment_proofs_proof_status_idx
  on public.payment_proofs (proof_status);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_user_id_idx
  on public.admin_audit_logs (admin_user_id);

create index if not exists admin_audit_logs_registration_record_id_idx
  on public.admin_audit_logs (registration_record_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

drop trigger if exists payment_settings_set_updated_at on public.payment_settings;
create trigger payment_settings_set_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();
