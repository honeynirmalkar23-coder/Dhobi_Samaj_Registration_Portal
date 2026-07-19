set check_function_bodies = off;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type public.registration_status as enum (
      'awaiting_payment',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'not_submitted',
      'pending_verification',
      'verified',
      'rejected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_proof_status') then
    create type public.payment_proof_status as enum (
      'pending_verification',
      'verified',
      'rejected'
    );
  end if;
end $$;
