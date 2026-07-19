create table if not exists public.registration_counters (
  registration_year integer primary key,
  last_value bigint not null check (last_value >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_id text unique not null,
  full_name text not null,
  age smallint not null,
  education_level text not null,
  education_details text null,
  permanent_address text not null,
  boys_count smallint not null default 0,
  girls_count smallint not null default 0,
  elders_count smallint not null default 0,
  total_family_members smallint generated always as
    (boys_count + girls_count + elders_count) stored,
  applicant_photo_path text not null,
  registration_status public.registration_status not null default 'awaiting_payment',
  payment_status public.payment_status not null default 'not_submitted',
  payment_resubmission_allowed boolean not null default false,
  public_rejection_message text null,
  admin_notes text null,
  payment_access_token_hash text not null,
  payment_access_token_expires_at timestamptz not null,
  payment_submitted_at timestamptz null,
  payment_verified_at timestamptz null,
  reviewed_at timestamptz null,
  approved_at timestamptz null,
  rejected_at timestamptz null,
  archived_at timestamptz null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registrations_registration_id_format check (registration_id ~ '^DS-[0-9]{4}-[0-9]{6}$'),
  constraint registrations_full_name_length check (char_length(full_name) between 2 and 100),
  constraint registrations_age_range check (age between 1 and 120),
  constraint registrations_address_length check (char_length(permanent_address) between 10 and 500),
  constraint registrations_boys_range check (boys_count between 0 and 99),
  constraint registrations_girls_range check (girls_count between 0 and 99),
  constraint registrations_elders_range check (elders_count between 0 and 99),
  constraint registrations_education_details_length check (
    education_details is null or char_length(education_details) <= 150
  ),
  constraint registrations_other_education_details check (
    education_level <> 'other' or nullif(btrim(coalesce(education_details, '')), '') is not null
  ),
  constraint registrations_public_rejection_length check (
    public_rejection_message is null or char_length(public_rejection_message) <= 500
  ),
  constraint registrations_admin_notes_length check (
    admin_notes is null or char_length(admin_notes) <= 5000
  ),
  constraint registrations_version_positive check (version > 0),
  constraint registrations_token_hash_not_plain check (char_length(payment_access_token_hash) >= 32)
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  registration_record_id uuid not null references public.registrations(id) on delete cascade,
  storage_path text not null,
  original_filename text null,
  mime_type text not null,
  size_bytes integer not null,
  proof_status public.payment_proof_status not null default 'pending_verification',
  public_rejection_message text null,
  reviewed_by uuid null references auth.users(id),
  reviewed_at timestamptz null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint payment_proofs_mime_type check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint payment_proofs_size_range check (size_bytes > 0 and size_bytes <= 5 * 1024 * 1024),
  constraint payment_proofs_public_rejection_length check (
    public_rejection_message is null or char_length(public_rejection_message) <= 500
  )
);

create table if not exists public.payment_settings (
  id smallint primary key default 1,
  payment_enabled boolean not null default false,
  qr_code_path text null,
  upi_id text null,
  payee_name text null,
  amount numeric(10, 2) null,
  payment_title text null,
  instructions text null,
  public_contact text null,
  payment_deadline timestamptz null,
  updated_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_settings_singleton check (id = 1),
  constraint payment_settings_amount_range check (amount is null or (amount > 0 and amount <= 100000)),
  constraint payment_settings_enabled_requirements check (
    payment_enabled = false or (
      nullif(btrim(coalesce(qr_code_path, '')), '') is not null and
      nullif(btrim(coalesce(upi_id, '')), '') is not null and
      nullif(btrim(coalesce(payee_name, '')), '') is not null and
      amount is not null and amount > 0 and amount <= 100000 and
      nullif(btrim(coalesce(payment_title, '')), '') is not null and
      nullif(btrim(coalesce(instructions, '')), '') is not null and
      nullif(btrim(coalesce(public_contact, '')), '') is not null
    )
  )
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  registration_record_id uuid null references public.registrations(id) on delete set null,
  action text not null,
  previous_value jsonb null,
  new_value jsonb null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  constraint admin_audit_logs_action check (
    action in (
      'payment_settings_updated',
      'payment_verified',
      'payment_rejected',
      'registration_marked_under_review',
      'registration_approved',
      'registration_rejected',
      'registration_archived',
      'payment_resubmission_enabled',
      'admin_note_updated'
    )
  )
);

create table if not exists public.public_request_rate_limits (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, action, window_started_at)
);
