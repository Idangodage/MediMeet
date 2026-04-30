-- RLS access examples for MediMeet.
-- Run against a seeded local/test Supabase database, not production.
-- Replace all UUID placeholders before running a section.

-- Example variables for psql:
-- \set patient_user_id '00000000-0000-0000-0000-000000000001'
-- \set other_patient_user_id '00000000-0000-0000-0000-000000000002'
-- \set doctor_user_id '00000000-0000-0000-0000-000000000003'
-- \set other_doctor_user_id '00000000-0000-0000-0000-000000000004'
-- \set clinic_admin_user_id '00000000-0000-0000-0000-000000000005'
-- \set platform_admin_user_id '00000000-0000-0000-0000-000000000006'
-- \set patient_profile_id '10000000-0000-0000-0000-000000000001'
-- \set other_patient_profile_id '10000000-0000-0000-0000-000000000002'
-- \set doctor_profile_id '20000000-0000-0000-0000-000000000001'
-- \set other_doctor_profile_id '20000000-0000-0000-0000-000000000002'
-- \set clinic_id '30000000-0000-0000-0000-000000000001'
-- \set unrelated_clinic_id '30000000-0000-0000-0000-000000000002'
-- \set appointment_id '40000000-0000-0000-0000-000000000001'
-- \set other_appointment_id '40000000-0000-0000-0000-000000000002'

begin;

-- Guest users can only read public verified doctors.
set local role anon;
select count(*) as guest_visible_unverified_doctors
from public.doctor_profiles
where verification_status <> 'approved' or is_public = false;
-- Expected: 0

select count(*) as guest_visible_patient_profiles
from public.patient_profiles;
-- Expected: 0

select count(*) as guest_visible_appointments
from public.appointments;
-- Expected: 0

select count(*) as guest_visible_verification_documents
from public.doctor_verification_documents;
-- Expected: 0

rollback;

begin;

-- Patients can read/update only their own patient profile.
set local role authenticated;
set local request.jwt.claim.sub = :'patient_user_id';
set local request.jwt.claim.role = 'authenticated';

select id
from public.patient_profiles;
-- Expected: only :patient_profile_id

update public.patient_profiles
set city = 'Own City'
where id = :'patient_profile_id'
returning id;
-- Expected: one row

update public.patient_profiles
set city = 'Blocked City'
where id = :'other_patient_profile_id'
returning id;
-- Expected: 0 rows

select id
from public.appointments
where patient_id <> :'patient_profile_id';
-- Expected: 0 rows

select id, title, read_status
from public.notifications;
-- Expected: only notifications where user_id = :patient_user_id

select id, doctor_id
from public.doctor_patient_relationships
where patient_id = :'patient_profile_id';
-- Expected: rows only for the signed-in patient's active/past doctor relationships

select id, doctor_id
from public.doctor_patient_relationships
where patient_id = :'other_patient_profile_id';
-- Expected: 0 rows

update public.appointments
set
  status = 'cancelled',
  cancelled_by = :'patient_user_id',
  cancellation_reason = 'Patient requested cancellation'
where id = :'appointment_id'
returning id, status;
-- Expected: one row if this is the patient's pending/confirmed appointment

update public.appointments
set appointment_date = appointment_date + 1
where id = :'appointment_id'
returning id;
-- Expected: error from appointments_enforce_update_security

rollback;

begin;

-- Doctors can only access their own doctor profile, availability, and appointments.
set local role authenticated;
set local request.jwt.claim.sub = :'doctor_user_id';
set local request.jwt.claim.role = 'authenticated';

select id
from public.doctor_profiles
where id = :'doctor_profile_id';
-- Expected: one row

update public.doctor_profiles
set biography = 'Updated by owning doctor'
where id = :'doctor_profile_id'
returning id;
-- Expected: one row

update public.doctor_profiles
set verification_status = 'approved'
where id = :'doctor_profile_id'
returning id;
-- Expected: error, only platform admins can verify doctors

select id
from public.appointments
where doctor_id <> :'doctor_profile_id';
-- Expected: 0 rows

select id
from public.patient_profiles
where id = :'patient_profile_id';
-- Expected: one row only if this patient has an appointment or active relationship with this doctor

select id
from public.patient_profiles
where id = :'other_patient_profile_id';
-- Expected: 0 rows unless relationship/appointment exists with this doctor

select id, title, read_status
from public.notifications;
-- Expected: only notifications where user_id = :doctor_user_id

select id, patient_id
from public.doctor_patient_relationships
where doctor_id = :'doctor_profile_id';
-- Expected: rows only for relationships owned by this doctor profile

select id, patient_id
from public.doctor_patient_relationships
where doctor_id = :'other_doctor_profile_id';
-- Expected: 0 rows unless this doctor is also clinic-scoped to that doctor

rollback;

begin;

-- Clinic admins can access only their clinic scope.
set local role authenticated;
set local request.jwt.claim.sub = :'clinic_admin_user_id';
set local request.jwt.claim.role = 'authenticated';

select public.is_clinic_admin(:'clinic_id') as can_admin_own_clinic;
-- Expected: true when active clinic_admin_memberships row exists

select public.is_clinic_admin(:'unrelated_clinic_id') as can_admin_unrelated_clinic;
-- Expected: false

select id
from public.appointments
where clinic_id = :'clinic_id';
-- Expected: rows for own clinic

select id
from public.appointments
where clinic_id = :'unrelated_clinic_id';
-- Expected: 0 rows

update public.doctor_clinic_memberships
set status = 'active'
where clinic_id = :'clinic_id'
returning id;
-- Expected: rows only for own clinic memberships

rollback;

begin;

-- Platform admins can verify doctors and must produce audit logs.
set local role authenticated;
set local request.jwt.claim.sub = :'platform_admin_user_id';
set local request.jwt.claim.role = 'authenticated';

update public.doctor_profiles
set verification_status = 'approved'
where id = :'doctor_profile_id'
returning id, verification_status;
-- Expected: one row

select action, resource_type, resource_id
from public.audit_logs
where actor_user_id = :'platform_admin_user_id'
  and resource_type = 'doctor_profiles'
order by created_at desc
limit 1;
-- Expected: latest audit log for the verification update

insert into public.notifications (
  user_id,
  title,
  body,
  type,
  event
)
values (
  :'doctor_user_id',
  'Verification approved',
  'Your doctor profile verification was approved.',
  'verification',
  'doctor_verification_approved'
)
returning id, event;
-- Expected: platform admin can create targeted operational notifications

update public.user_reports
set
  status = 'resolved',
  reviewed_by = :'platform_admin_user_id',
  reviewed_at = now()
where status in ('open', 'under_review')
returning id, status;
-- Expected: platform admin can manage reported users

rollback;
