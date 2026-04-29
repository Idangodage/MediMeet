create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.verification_status as enum (
    'pending',
    'approved',
    'rejected',
    'needs_review'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.verification_document_type as enum (
    'medical_license',
    'identity_document',
    'board_certificate',
    'insurance',
    'other'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.membership_role as enum (
    'owner',
    'admin',
    'doctor',
    'assistant'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.membership_status as enum (
    'pending',
    'active',
    'suspended',
    'removed'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.consultation_type as enum (
    'in_person',
    'video',
    'phone'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.slot_status as enum (
    'available',
    'held',
    'booked',
    'blocked',
    'cancelled'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.appointment_status as enum (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
    'rescheduled'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.patient_relationship_status as enum (
    'active',
    'inactive',
    'archived'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.subscription_status as enum (
    'trialing',
    'active',
    'past_due',
    'cancelled',
    'expired'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.payment_type as enum (
    'appointment',
    'subscription',
    'refund',
    'adjustment'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.payment_provider as enum (
    'stripe',
    'manual',
    'other'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded',
    'cancelled'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.invoice_status as enum (
    'draft',
    'open',
    'paid',
    'void',
    'uncollectible'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.notification_type as enum (
    'appointment',
    'payment',
    'subscription',
    'system',
    'verification'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.notification_read_status as enum (
    'unread',
    'read'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists avatar_url text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_path'
  ) then
    execute 'update public.profiles set avatar_url = avatar_path where avatar_url is null';
  end if;
end;
$$;

alter table public.profiles
  drop column if exists avatar_path,
  drop column if exists clinic_id;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_email_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_email_format_check
      check (
        email is null
        or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_phone_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_phone_length_check
      check (phone is null or length(phone) between 7 and 32);
  end if;
end;
$$;

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;

create index if not exists profiles_role_idx
on public.profiles (role);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'platform_admin', false)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'patient'
  )
  on conflict (id) do update
  set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    email = excluded.email,
    phone = coalesce(public.profiles.phone, excluded.phone);

  return new;
end;
$$;

create table if not exists public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date_of_birth date,
  city text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_profiles_user_unique unique (user_id),
  constraint patient_profiles_preferred_language_check
    check (length(preferred_language) between 2 and 16),
  constraint patient_profiles_date_of_birth_check
    check (date_of_birth is null or date_of_birth <= current_date)
);

create table if not exists public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  full_name text not null,
  profile_image_url text,
  registration_number text not null,
  qualifications text[] not null default '{}',
  specialties text[] not null default '{}',
  subspecialties text[] not null default '{}',
  years_of_experience integer not null default 0,
  languages text[] not null default '{}',
  biography text,
  consultation_fee numeric(10, 2) not null default 0,
  verification_status public.verification_status not null default 'pending',
  is_public boolean not null default false,
  average_rating numeric(3, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_profiles_user_unique unique (user_id),
  constraint doctor_profiles_registration_number_unique unique (registration_number),
  constraint doctor_profiles_years_of_experience_check
    check (years_of_experience >= 0),
  constraint doctor_profiles_consultation_fee_check
    check (consultation_fee >= 0),
  constraint doctor_profiles_average_rating_check
    check (average_rating >= 0 and average_rating <= 5)
);

create table if not exists public.doctor_verification_documents (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  document_type public.verification_document_type not null,
  file_url text not null,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint doctor_verification_documents_review_check
    check (
      (reviewed_by is null and reviewed_at is null)
      or (reviewed_by is not null and reviewed_at is not null)
    )
);

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  phone text,
  email text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinics_email_format_check
    check (
      email is null
      or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ),
  constraint clinics_phone_length_check
    check (phone is null or length(phone) between 7 and 32)
);

create table if not exists public.clinic_locations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  address text not null,
  city text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  opening_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_locations_latitude_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint clinic_locations_longitude_check
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint clinic_locations_opening_hours_check
    check (jsonb_typeof(opening_hours) = 'object')
);

create table if not exists public.doctor_clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  role public.membership_role not null default 'doctor',
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint doctor_clinic_memberships_unique unique (doctor_id, clinic_id)
);

create table if not exists public.doctor_locations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  clinic_location_id uuid references public.clinic_locations(id) on delete set null,
  custom_location_name text,
  address text,
  city text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean not null default true,
  constraint doctor_locations_latitude_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint doctor_locations_longitude_check
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint doctor_locations_source_check
    check (
      clinic_location_id is not null
      or (custom_location_name is not null and address is not null and city is not null)
    )
);

create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  location_id uuid not null references public.doctor_locations(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  appointment_duration_minutes integer not null default 30,
  break_minutes integer not null default 0,
  max_patients integer not null default 1,
  consultation_type public.consultation_type not null default 'in_person',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint doctor_availability_time_check
    check (start_time < end_time),
  constraint doctor_availability_duration_check
    check (appointment_duration_minutes > 0),
  constraint doctor_availability_break_check
    check (break_minutes >= 0),
  constraint doctor_availability_max_patients_check
    check (max_patients > 0)
);

create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  availability_id uuid not null references public.doctor_availability(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.slot_status not null default 'available',
  created_at timestamptz not null default now(),
  constraint appointment_slots_time_check
    check (start_time < end_time),
  constraint appointment_slots_availability_time_unique
    unique (availability_id, start_time)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id),
  doctor_id uuid not null references public.doctor_profiles(id),
  clinic_id uuid references public.clinics(id),
  location_id uuid not null references public.doctor_locations(id),
  slot_id uuid references public.appointment_slots(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  reason_for_visit text,
  status public.appointment_status not null default 'pending',
  cancellation_reason text,
  cancelled_by uuid references public.profiles(id) on delete set null,
  rescheduled_from uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_check
    check (start_time < end_time)
);

create table if not exists public.doctor_patient_relationships (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  first_visit_date date,
  last_visit_date date,
  total_visits integer not null default 0,
  relationship_status public.patient_relationship_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_patient_relationships_unique unique (doctor_id, patient_id),
  constraint doctor_patient_relationships_visits_check
    check (total_visits >= 0),
  constraint doctor_patient_relationships_dates_check
    check (
      first_visit_date is null
      or last_visit_date is null
      or first_visit_date <= last_visit_date
    )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  rating integer not null,
  comment text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  constraint reviews_appointment_unique unique (appointment_id),
  constraint reviews_rating_check check (rating between 1 and 5)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctor_profiles(id),
  clinic_id uuid references public.clinics(id),
  plan_name text not null,
  status public.subscription_status not null default 'trialing',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_owner_check
    check (doctor_id is not null or clinic_id is not null),
  constraint subscriptions_period_check
    check (
      current_period_start is null
      or current_period_end is null
      or current_period_start < current_period_end
    )
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payer_user_id uuid references public.profiles(id),
  doctor_id uuid references public.doctor_profiles(id),
  clinic_id uuid references public.clinics(id),
  appointment_id uuid references public.appointments(id),
  amount numeric(10, 2) not null,
  currency char(3) not null default 'USD',
  payment_type public.payment_type not null,
  provider public.payment_provider not null default 'stripe',
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint payments_amount_check check (amount >= 0),
  constraint payments_currency_uppercase_check
    check (currency = upper(currency))
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  doctor_id uuid references public.doctor_profiles(id),
  clinic_id uuid references public.clinics(id),
  amount numeric(10, 2) not null,
  currency char(3) not null default 'USD',
  invoice_url text,
  status public.invoice_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint invoices_amount_check check (amount >= 0),
  constraint invoices_currency_uppercase_check
    check (currency = upper(currency)),
  constraint invoices_owner_check
    check (doctor_id is not null or clinic_id is not null)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type public.notification_type not null default 'system',
  read_status public.notification_read_status not null default 'unread',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

drop trigger if exists patient_profiles_touch_updated_at on public.patient_profiles;
create trigger patient_profiles_touch_updated_at
before update on public.patient_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists doctor_profiles_touch_updated_at on public.doctor_profiles;
create trigger doctor_profiles_touch_updated_at
before update on public.doctor_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists clinics_touch_updated_at on public.clinics;
create trigger clinics_touch_updated_at
before update on public.clinics
for each row execute function public.touch_updated_at();

drop trigger if exists clinic_locations_touch_updated_at on public.clinic_locations;
create trigger clinic_locations_touch_updated_at
before update on public.clinic_locations
for each row execute function public.touch_updated_at();

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at
before update on public.appointments
for each row execute function public.touch_updated_at();

drop trigger if exists doctor_patient_relationships_touch_updated_at
on public.doctor_patient_relationships;
create trigger doctor_patient_relationships_touch_updated_at
before update on public.doctor_patient_relationships
for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

create index if not exists patient_profiles_user_id_idx
on public.patient_profiles (user_id);

create index if not exists patient_profiles_city_idx
on public.patient_profiles (city);

create index if not exists doctor_profiles_user_id_idx
on public.doctor_profiles (user_id);

create index if not exists doctor_profiles_public_verification_idx
on public.doctor_profiles (is_public, verification_status);

create index if not exists doctor_profiles_specialties_idx
on public.doctor_profiles using gin (specialties);

create index if not exists doctor_profiles_subspecialties_idx
on public.doctor_profiles using gin (subspecialties);

create index if not exists doctor_profiles_languages_idx
on public.doctor_profiles using gin (languages);

create index if not exists doctor_profiles_average_rating_idx
on public.doctor_profiles (average_rating desc);

create index if not exists doctor_verification_documents_doctor_id_idx
on public.doctor_verification_documents (doctor_id);

create index if not exists doctor_verification_documents_status_idx
on public.doctor_verification_documents (status);

create index if not exists clinics_name_idx
on public.clinics (name);

create index if not exists clinic_locations_clinic_id_idx
on public.clinic_locations (clinic_id);

create index if not exists clinic_locations_city_idx
on public.clinic_locations (city);

create index if not exists clinic_locations_opening_hours_idx
on public.clinic_locations using gin (opening_hours);

create index if not exists doctor_clinic_memberships_doctor_id_idx
on public.doctor_clinic_memberships (doctor_id);

create index if not exists doctor_clinic_memberships_clinic_id_idx
on public.doctor_clinic_memberships (clinic_id);

create index if not exists doctor_clinic_memberships_status_idx
on public.doctor_clinic_memberships (status);

create index if not exists doctor_locations_doctor_id_idx
on public.doctor_locations (doctor_id);

create index if not exists doctor_locations_clinic_location_id_idx
on public.doctor_locations (clinic_location_id);

create index if not exists doctor_locations_city_idx
on public.doctor_locations (city);

create index if not exists doctor_locations_active_idx
on public.doctor_locations (is_active);

create index if not exists doctor_availability_doctor_date_idx
on public.doctor_availability (doctor_id, date);

create index if not exists doctor_availability_location_date_idx
on public.doctor_availability (location_id, date);

create index if not exists doctor_availability_active_idx
on public.doctor_availability (is_active);

create index if not exists appointment_slots_doctor_start_time_idx
on public.appointment_slots (doctor_id, start_time);

create index if not exists appointment_slots_availability_status_idx
on public.appointment_slots (availability_id, status);

create index if not exists appointment_slots_status_idx
on public.appointment_slots (status);

create unique index if not exists appointments_active_slot_unique_idx
on public.appointments (slot_id)
where slot_id is not null
  and status not in ('cancelled', 'rescheduled');

create index if not exists appointments_patient_date_idx
on public.appointments (patient_id, appointment_date);

create index if not exists appointments_doctor_date_idx
on public.appointments (doctor_id, appointment_date);

create index if not exists appointments_clinic_date_idx
on public.appointments (clinic_id, appointment_date);

create index if not exists appointments_status_idx
on public.appointments (status);

create index if not exists appointments_rescheduled_from_idx
on public.appointments (rescheduled_from);

create index if not exists doctor_patient_relationships_doctor_id_idx
on public.doctor_patient_relationships (doctor_id);

create index if not exists doctor_patient_relationships_patient_id_idx
on public.doctor_patient_relationships (patient_id);

create index if not exists doctor_patient_relationships_status_idx
on public.doctor_patient_relationships (relationship_status);

create index if not exists reviews_doctor_public_created_idx
on public.reviews (doctor_id, is_public, created_at desc);

create index if not exists reviews_patient_id_idx
on public.reviews (patient_id);

create index if not exists subscriptions_doctor_status_idx
on public.subscriptions (doctor_id, status);

create index if not exists subscriptions_clinic_status_idx
on public.subscriptions (clinic_id, status);

create unique index if not exists subscriptions_provider_subscription_id_unique_idx
on public.subscriptions (provider_subscription_id)
where provider_subscription_id is not null;

create index if not exists payments_payer_status_idx
on public.payments (payer_user_id, status);

create index if not exists payments_doctor_id_idx
on public.payments (doctor_id);

create index if not exists payments_clinic_id_idx
on public.payments (clinic_id);

create index if not exists payments_appointment_id_idx
on public.payments (appointment_id);

create unique index if not exists payments_provider_payment_unique_idx
on public.payments (provider, provider_payment_id)
where provider_payment_id is not null;

create index if not exists invoices_subscription_id_idx
on public.invoices (subscription_id);

create index if not exists invoices_doctor_id_idx
on public.invoices (doctor_id);

create index if not exists invoices_clinic_id_idx
on public.invoices (clinic_id);

create index if not exists invoices_status_idx
on public.invoices (status);

create index if not exists notifications_user_read_created_idx
on public.notifications (user_id, read_status, created_at desc);

create index if not exists audit_logs_actor_created_idx
on public.audit_logs (actor_user_id, created_at desc);

create index if not exists audit_logs_resource_idx
on public.audit_logs (resource_type, resource_id);

create index if not exists audit_logs_metadata_idx
on public.audit_logs using gin (metadata);
