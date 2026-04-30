-- MediMeet security access matrix.
-- Run against a local or linked test database:
--   npx supabase db query --linked -f supabase/tests/security_access_matrix.sql
--
-- This script creates isolated seed rows inside one transaction, switches
-- request.jwt.claim.sub and database role to exercise RLS, records pass/fail
-- checks in a temporary table, then rolls back all seed data.

begin;

create temp table security_test_results (
  area text not null,
  check_name text not null,
  passed boolean not null,
  details text
) on commit drop;

grant select, insert on security_test_results to anon, authenticated;

create or replace function pg_temp.record_security_result(
  area text,
  check_name text,
  passed boolean,
  details text default null
)
returns void
language plpgsql
as $$
begin
  insert into security_test_results (area, check_name, passed, details)
  values (area, check_name, passed, details);
end;
$$;

create or replace function pg_temp.seed_auth_user(
  target_user_id uuid,
  target_email text,
  target_role public.app_role
)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    target_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    target_email,
    'security-test-password-hash',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', target_role),
    now(),
    now()
  );

  update public.profiles
  set
    role = target_role,
    full_name = initcap(replace(target_role::text, '_', ' ')) || ' Security Test',
    email = target_email,
    phone = '+15550000000'
  where id = target_user_id;
end;
$$;

create or replace function pg_temp.as_anon()
returns void
language plpgsql
as $$
begin
  set local role anon;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
end;
$$;

create or replace function pg_temp.as_user(target_user_id uuid)
returns void
language plpgsql
as $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', target_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end;
$$;

create or replace function pg_temp.clear_auth_context()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'service_role', true);
end;
$$;

-- Stable UUIDs for this transaction only.
select pg_temp.seed_auth_user(
  '00000000-0000-4000-8000-000000000101',
  'security.patient@example.test',
  'patient'
);
select pg_temp.seed_auth_user(
  '00000000-0000-4000-8000-000000000102',
  'security.other.patient@example.test',
  'patient'
);
select pg_temp.seed_auth_user(
  '00000000-0000-4000-8000-000000000201',
  'security.doctor@example.test',
  'doctor'
);
select pg_temp.seed_auth_user(
  '00000000-0000-4000-8000-000000000202',
  'security.other.doctor@example.test',
  'doctor'
);
select pg_temp.seed_auth_user(
  '00000000-0000-4000-8000-000000000301',
  'security.clinic.admin@example.test',
  'clinic_admin'
);
select pg_temp.seed_auth_user(
  '00000000-0000-4000-8000-000000000401',
  'security.platform.admin@example.test',
  'platform_admin'
);

insert into public.patient_profiles (
  id,
  user_id,
  date_of_birth,
  city,
  preferred_language
)
values
  (
    '10000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000101',
    '1990-01-01',
    'Own City',
    'en'
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000102',
    '1991-01-01',
    'Other City',
    'en'
  );

insert into public.doctor_profiles (
  id,
  user_id,
  title,
  full_name,
  registration_number,
  qualifications,
  specialties,
  subspecialties,
  years_of_experience,
  languages,
  biography,
  consultation_fee,
  verification_status,
  is_public
)
values
  (
    '20000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000201',
    'Dr.',
    'Own Doctor',
    'SEC-OWN-DOCTOR',
    array['MBBS'],
    array['Cardiology'],
    array['Preventive cardiology'],
    10,
    array['en'],
    'Security test doctor.',
    100,
    'approved',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000202',
    'Dr.',
    'Other Doctor',
    'SEC-OTHER-DOCTOR',
    array['MD'],
    array['Dermatology'],
    array['Clinical dermatology'],
    7,
    array['en'],
    'Private security test doctor.',
    120,
    'pending',
    false
  );

insert into public.clinics (
  id,
  name,
  phone,
  email
)
values
  (
    '30000000-0000-4000-8000-000000000301',
    'Security Clinic',
    '+15550000001',
    'security.clinic@example.test'
  ),
  (
    '30000000-0000-4000-8000-000000000302',
    'Unrelated Clinic',
    '+15550000002',
    'security.unrelated.clinic@example.test'
  );

insert into public.clinic_admin_memberships (
  id,
  user_id,
  clinic_id,
  role,
  status
)
values (
  '31000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000301',
  '30000000-0000-4000-8000-000000000301',
  'owner',
  'active'
);

insert into public.clinic_locations (
  id,
  clinic_id,
  address,
  city
)
values
  (
    '32000000-0000-4000-8000-000000000301',
    '30000000-0000-4000-8000-000000000301',
    '1 Security Street',
    'Own City'
  ),
  (
    '32000000-0000-4000-8000-000000000302',
    '30000000-0000-4000-8000-000000000302',
    '2 Unrelated Street',
    'Other City'
  );

insert into public.doctor_clinic_memberships (
  id,
  doctor_id,
  clinic_id,
  role,
  status
)
values (
  '33000000-0000-4000-8000-000000000301',
  '20000000-0000-4000-8000-000000000201',
  '30000000-0000-4000-8000-000000000301',
  'doctor',
  'active'
);

insert into public.doctor_locations (
  id,
  doctor_id,
  clinic_location_id,
  custom_location_name,
  address,
  city,
  is_active
)
values
  (
    '34000000-0000-4000-8000-000000000201',
    '20000000-0000-4000-8000-000000000201',
    '32000000-0000-4000-8000-000000000301',
    'Security Clinic Room 1',
    '1 Security Street',
    'Own City',
    true
  ),
  (
    '34000000-0000-4000-8000-000000000202',
    '20000000-0000-4000-8000-000000000202',
    '32000000-0000-4000-8000-000000000302',
    'Private Other Doctor Room',
    '2 Unrelated Street',
    'Other City',
    true
  );

insert into public.doctor_availability (
  id,
  doctor_id,
  location_id,
  date,
  start_time,
  end_time,
  appointment_duration_minutes,
  break_minutes,
  max_patients,
  consultation_type,
  is_active
)
values
  (
    '35000000-0000-4000-8000-000000000201',
    '20000000-0000-4000-8000-000000000201',
    '34000000-0000-4000-8000-000000000201',
    current_date + 10,
    '09:00',
    '10:00',
    30,
    0,
    2,
    'in_person',
    true
  ),
  (
    '35000000-0000-4000-8000-000000000202',
    '20000000-0000-4000-8000-000000000202',
    '34000000-0000-4000-8000-000000000202',
    current_date + 10,
    '09:00',
    '10:00',
    30,
    0,
    2,
    'in_person',
    true
  );

insert into public.appointment_slots (
  id,
  doctor_id,
  availability_id,
  start_time,
  end_time,
  status
)
values
  (
    '36000000-0000-4000-8000-000000000201',
    '20000000-0000-4000-8000-000000000201',
    '35000000-0000-4000-8000-000000000201',
    (current_date + 10)::timestamp + time '09:00',
    (current_date + 10)::timestamp + time '09:30',
    'booked'
  ),
  (
    '36000000-0000-4000-8000-000000000202',
    '20000000-0000-4000-8000-000000000202',
    '35000000-0000-4000-8000-000000000202',
    (current_date + 10)::timestamp + time '09:00',
    (current_date + 10)::timestamp + time '09:30',
    'booked'
  );

insert into public.appointments (
  id,
  patient_id,
  doctor_id,
  clinic_id,
  location_id,
  slot_id,
  appointment_date,
  start_time,
  end_time,
  reason_for_visit,
  status
)
values
  (
    '40000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000101',
    '20000000-0000-4000-8000-000000000201',
    '30000000-0000-4000-8000-000000000301',
    '34000000-0000-4000-8000-000000000201',
    '36000000-0000-4000-8000-000000000201',
    current_date + 10,
    '09:00',
    '09:30',
    'Security test appointment',
    'confirmed'
  ),
  (
    '40000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000102',
    '20000000-0000-4000-8000-000000000202',
    null,
    '34000000-0000-4000-8000-000000000202',
    '36000000-0000-4000-8000-000000000202',
    current_date + 10,
    '09:00',
    '09:30',
    'Unrelated security test appointment',
    'confirmed'
  );

insert into public.doctor_patient_relationships (
  id,
  doctor_id,
  patient_id,
  first_visit_date,
  last_visit_date,
  total_visits,
  relationship_status
)
values (
  '41000000-0000-4000-8000-000000000101',
  '20000000-0000-4000-8000-000000000201',
  '10000000-0000-4000-8000-000000000101',
  current_date - 30,
  current_date - 30,
  1,
  'active'
);

insert into public.doctor_verification_documents (
  id,
  doctor_id,
  document_type,
  file_url,
  storage_path,
  status
)
values (
  '50000000-0000-4000-8000-000000000202',
  '20000000-0000-4000-8000-000000000202',
  'medical_registration_certificate',
  'private://doctor-verification-documents/security-test.pdf',
  '20000000-0000-4000-8000-000000000202/security-test.pdf',
  'pending'
);

-- Guest checks.
select pg_temp.as_anon();

select pg_temp.record_security_result(
  'guest',
  'cannot read patient profiles',
  (select count(*) = 0 from public.patient_profiles)
);

select pg_temp.record_security_result(
  'guest',
  'cannot read appointments',
  (select count(*) = 0 from public.appointments)
);

select pg_temp.record_security_result(
  'guest',
  'cannot read verification documents',
  (select count(*) = 0 from public.doctor_verification_documents)
);

select pg_temp.record_security_result(
  'guest',
  'can see public verified doctor profiles',
  exists (
    select 1
    from public.doctor_profiles
    where id = '20000000-0000-4000-8000-000000000201'
      and is_public = true
      and verification_status = 'approved'
  )
);

select pg_temp.record_security_result(
  'guest',
  'cannot see private or unverified doctor profiles',
  not exists (
    select 1
    from public.doctor_profiles
    where id = '20000000-0000-4000-8000-000000000202'
  )
);

-- Patient checks.
reset role;
select pg_temp.as_user('00000000-0000-4000-8000-000000000101');

select pg_temp.record_security_result(
  'patient',
  'cannot read another patient appointment',
  not exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000102'
  )
);

select pg_temp.record_security_result(
  'patient',
  'cannot read other patient profile data',
  not exists (
    select 1
    from public.patient_profiles
    where id = '10000000-0000-4000-8000-000000000102'
  )
);

update public.appointments
set
  status = 'cancelled_by_patient',
  cancelled_by = '00000000-0000-4000-8000-000000000101',
  cancellation_reason = 'Security test cancellation'
where id = '40000000-0000-4000-8000-000000000101';

select pg_temp.record_security_result(
  'patient',
  'can cancel own appointment',
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000101'
      and status = 'cancelled_by_patient'
  )
);

with blocked_update as (
  update public.appointments
  set
    status = 'cancelled_by_patient',
    cancelled_by = '00000000-0000-4000-8000-000000000101',
    cancellation_reason = 'Blocked cancellation'
  where id = '40000000-0000-4000-8000-000000000102'
  returning id
)
select pg_temp.record_security_result(
  'patient',
  'cannot cancel another patient appointment',
  (select count(*) = 0 from blocked_update),
  'RLS should update zero rows for another patient appointment.'
);

-- Restore own appointment status for later doctor/clinic checks.
reset role;
select pg_temp.clear_auth_context();

update public.appointments
set
  status = 'confirmed',
  cancelled_by = null,
  cancellation_reason = null
where id = '40000000-0000-4000-8000-000000000101';

-- Doctor checks.
select pg_temp.as_user('00000000-0000-4000-8000-000000000201');

select pg_temp.record_security_result(
  'doctor',
  'cannot read another doctor appointment',
  not exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000102'
  )
);

select pg_temp.record_security_result(
  'doctor',
  'cannot read patients without appointment or relationship',
  not exists (
    select 1
    from public.patient_profiles
    where id = '10000000-0000-4000-8000-000000000102'
  )
);

update public.doctor_profiles
set biography = 'Security test own doctor profile update'
where id = '20000000-0000-4000-8000-000000000201';

select pg_temp.record_security_result(
  'doctor',
  'can edit own doctor profile',
  exists (
    select 1
    from public.doctor_profiles
    where id = '20000000-0000-4000-8000-000000000201'
      and biography = 'Security test own doctor profile update'
  )
);

with blocked_update as (
  update public.doctor_profiles
  set biography = 'Blocked other doctor update'
  where id = '20000000-0000-4000-8000-000000000202'
  returning id
)
select pg_temp.record_security_result(
  'doctor',
  'cannot edit another doctor profile',
  (select count(*) = 0 from blocked_update),
  'RLS should update zero rows for another doctor profile.'
);

update public.doctor_availability
set max_patients = 3
where id = '35000000-0000-4000-8000-000000000201';

select pg_temp.record_security_result(
  'doctor',
  'can manage own availability',
  exists (
    select 1
    from public.doctor_availability
    where id = '35000000-0000-4000-8000-000000000201'
      and max_patients = 3
  )
);

with blocked_update as (
  update public.doctor_availability
  set max_patients = 5
  where id = '35000000-0000-4000-8000-000000000202'
  returning id
)
select pg_temp.record_security_result(
  'doctor',
  'cannot manage another doctor availability',
  (select count(*) = 0 from blocked_update),
  'RLS should update zero rows for another doctor availability.'
);

-- Clinic admin checks.
reset role;
select pg_temp.as_user('00000000-0000-4000-8000-000000000301');

select pg_temp.record_security_result(
  'clinic_admin',
  'can access own clinic',
  public.is_clinic_admin('30000000-0000-4000-8000-000000000301')
);

select pg_temp.record_security_result(
  'clinic_admin',
  'cannot access unrelated clinic',
  not public.is_clinic_admin('30000000-0000-4000-8000-000000000302')
);

select pg_temp.record_security_result(
  'clinic_admin',
  'can read connected private doctor profile',
  exists (
    select 1
    from public.doctor_profiles
    where id = '20000000-0000-4000-8000-000000000201'
  )
);

select pg_temp.record_security_result(
  'clinic_admin',
  'cannot read unrelated private doctor profile',
  not exists (
    select 1
    from public.doctor_profiles
    where id = '20000000-0000-4000-8000-000000000202'
  )
);

select pg_temp.record_security_result(
  'clinic_admin',
  'can read own clinic appointment',
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000101'
  )
);

select pg_temp.record_security_result(
  'clinic_admin',
  'cannot read unrelated appointment',
  not exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000102'
  )
);

-- Platform admin checks.
reset role;
select pg_temp.as_user('00000000-0000-4000-8000-000000000401');

select pg_temp.record_security_result(
  'platform_admin',
  'can access verification queue',
  exists (
    select 1
    from public.doctor_verification_documents
    where id = '50000000-0000-4000-8000-000000000202'
  )
);

select public.admin_moderate_doctor_profile(
  '20000000-0000-4000-8000-000000000202',
  'needs_review',
  false,
  'Security test admin audit action'
);

select pg_temp.record_security_result(
  'platform_admin',
  'can access audit logs',
  exists (
    select 1
    from public.audit_logs
    where actor_user_id = '00000000-0000-4000-8000-000000000401'
      and action = 'doctor_profile_moderation'
      and resource_id = '20000000-0000-4000-8000-000000000202'
  ),
  'Platform admin should be able to read the audit log created by its own moderation action.'
);

select pg_temp.record_security_result(
  'platform_admin',
  'admin moderation creates audit log',
  exists (
    select 1
    from public.audit_logs
    where actor_user_id = '00000000-0000-4000-8000-000000000401'
      and action = 'doctor_profile_moderation'
      and resource_id = '20000000-0000-4000-8000-000000000202'
  )
);

reset role;

select *
from security_test_results
order by area, check_name;

do $$
begin
  if exists (select 1 from security_test_results where not passed) then
    raise exception 'Security access matrix failed. Review failed rows above.';
  end if;
end;
$$;

rollback;
