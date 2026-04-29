create or replace function public.is_profile_owner(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.uid() = target_user_id, false)
$$;

create or replace function public.is_patient_profile_owner(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_profiles
    where id = target_patient_id
      and user_id = auth.uid()
  )
$$;

create or replace function public.is_doctor_profile_owner(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_profiles
    where id = target_doctor_id
      and user_id = auth.uid()
  )
$$;

create or replace function public.is_public_doctor(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_profiles
    where id = target_doctor_id
      and is_public = true
      and verification_status = 'approved'
  )
$$;

create or replace function public.can_access_appointment(target_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments
    where id = target_appointment_id
      and (
        public.is_patient_profile_owner(patient_id)
        or public.is_doctor_profile_owner(doctor_id)
        or public.is_platform_admin()
      )
  )
$$;

create or replace function public.can_review_appointment(
  target_appointment_id uuid,
  target_patient_id uuid,
  target_doctor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments
    where id = target_appointment_id
      and patient_id = target_patient_id
      and doctor_id = target_doctor_id
      and status = 'completed'
  )
$$;

alter table public.patient_profiles enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.doctor_verification_documents enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_locations enable row level security;
alter table public.doctor_clinic_memberships enable row level security;
alter table public.doctor_locations enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_patient_relationships enable row level security;
alter table public.reviews enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Patients can read their patient profile" on public.patient_profiles;
create policy "Patients can read their patient profile"
on public.patient_profiles
for select
to authenticated
using (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Patients can insert their patient profile" on public.patient_profiles;
create policy "Patients can insert their patient profile"
on public.patient_profiles
for insert
to authenticated
with check (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Patients can update their patient profile" on public.patient_profiles;
create policy "Patients can update their patient profile"
on public.patient_profiles
for update
to authenticated
using (public.is_profile_owner(user_id) or public.is_platform_admin())
with check (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Public can read approved doctors" on public.doctor_profiles;
create policy "Public can read approved doctors"
on public.doctor_profiles
for select
to anon, authenticated
using (is_public = true and verification_status = 'approved');

drop policy if exists "Doctors can read their doctor profile" on public.doctor_profiles;
create policy "Doctors can read their doctor profile"
on public.doctor_profiles
for select
to authenticated
using (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Doctors can insert their doctor profile" on public.doctor_profiles;
create policy "Doctors can insert their doctor profile"
on public.doctor_profiles
for insert
to authenticated
with check (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Doctors can update their doctor profile" on public.doctor_profiles;
create policy "Doctors can update their doctor profile"
on public.doctor_profiles
for update
to authenticated
using (public.is_profile_owner(user_id) or public.is_platform_admin())
with check (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Doctors can read their verification documents" on public.doctor_verification_documents;
create policy "Doctors can read their verification documents"
on public.doctor_verification_documents
for select
to authenticated
using (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Doctors can upload verification documents" on public.doctor_verification_documents;
create policy "Doctors can upload verification documents"
on public.doctor_verification_documents
for insert
to authenticated
with check (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Platform admins can review verification documents" on public.doctor_verification_documents;
create policy "Platform admins can review verification documents"
on public.doctor_verification_documents
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Public can read clinics" on public.clinics;
create policy "Public can read clinics"
on public.clinics
for select
to anon, authenticated
using (true);

drop policy if exists "Platform admins can manage clinics" on public.clinics;
create policy "Platform admins can manage clinics"
on public.clinics
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Public can read clinic locations" on public.clinic_locations;
create policy "Public can read clinic locations"
on public.clinic_locations
for select
to anon, authenticated
using (true);

drop policy if exists "Platform admins can manage clinic locations" on public.clinic_locations;
create policy "Platform admins can manage clinic locations"
on public.clinic_locations
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Doctors can read their clinic memberships" on public.doctor_clinic_memberships;
create policy "Doctors can read their clinic memberships"
on public.doctor_clinic_memberships
for select
to authenticated
using (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Platform admins can manage doctor clinic memberships" on public.doctor_clinic_memberships;
create policy "Platform admins can manage doctor clinic memberships"
on public.doctor_clinic_memberships
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Public can read active doctor locations" on public.doctor_locations;
create policy "Public can read active doctor locations"
on public.doctor_locations
for select
to anon, authenticated
using (is_active = true and public.is_public_doctor(doctor_id));

drop policy if exists "Doctors can manage their locations" on public.doctor_locations;
create policy "Doctors can manage their locations"
on public.doctor_locations
for all
to authenticated
using (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin())
with check (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Public can read active doctor availability" on public.doctor_availability;
create policy "Public can read active doctor availability"
on public.doctor_availability
for select
to anon, authenticated
using (is_active = true and public.is_public_doctor(doctor_id));

drop policy if exists "Doctors can manage their availability" on public.doctor_availability;
create policy "Doctors can manage their availability"
on public.doctor_availability
for all
to authenticated
using (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin())
with check (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Public can read available appointment slots" on public.appointment_slots;
create policy "Public can read available appointment slots"
on public.appointment_slots
for select
to anon, authenticated
using (status = 'available' and public.is_public_doctor(doctor_id));

drop policy if exists "Doctors can manage their appointment slots" on public.appointment_slots;
create policy "Doctors can manage their appointment slots"
on public.appointment_slots
for all
to authenticated
using (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin())
with check (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Appointment participants can read appointments" on public.appointments;
create policy "Appointment participants can read appointments"
on public.appointments
for select
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

drop policy if exists "Patients can create appointments" on public.appointments;
create policy "Patients can create appointments"
on public.appointments
for insert
to authenticated
with check (
  public.is_patient_profile_owner(patient_id)
  or public.is_platform_admin()
);

drop policy if exists "Appointment participants can update appointments" on public.appointments;
create policy "Appointment participants can update appointments"
on public.appointments
for update
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
)
with check (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

drop policy if exists "Relationship participants can read relationships" on public.doctor_patient_relationships;
create policy "Relationship participants can read relationships"
on public.doctor_patient_relationships
for select
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

drop policy if exists "Doctors can manage patient relationships" on public.doctor_patient_relationships;
create policy "Doctors can manage patient relationships"
on public.doctor_patient_relationships
for all
to authenticated
using (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin())
with check (public.is_doctor_profile_owner(doctor_id) or public.is_platform_admin());

drop policy if exists "Public can read public reviews" on public.reviews;
create policy "Public can read public reviews"
on public.reviews
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Review owners can read their reviews" on public.reviews;
create policy "Review owners can read their reviews"
on public.reviews
for select
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

drop policy if exists "Patients can create reviews for completed appointments" on public.reviews;
create policy "Patients can create reviews for completed appointments"
on public.reviews
for insert
to authenticated
with check (
  public.is_patient_profile_owner(patient_id)
  and public.can_review_appointment(appointment_id, patient_id, doctor_id)
);

drop policy if exists "Patients can update their reviews" on public.reviews;
create policy "Patients can update their reviews"
on public.reviews
for update
to authenticated
using (public.is_patient_profile_owner(patient_id) or public.is_platform_admin())
with check (public.is_patient_profile_owner(patient_id) or public.is_platform_admin());

drop policy if exists "Subscription owners can read subscriptions" on public.subscriptions;
create policy "Subscription owners can read subscriptions"
on public.subscriptions
for select
to authenticated
using (
  (doctor_id is not null and public.is_doctor_profile_owner(doctor_id))
  or public.is_platform_admin()
);

drop policy if exists "Platform admins can manage subscriptions" on public.subscriptions;
create policy "Platform admins can manage subscriptions"
on public.subscriptions
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Payment participants can read payments" on public.payments;
create policy "Payment participants can read payments"
on public.payments
for select
to authenticated
using (
  public.is_profile_owner(payer_user_id)
  or (doctor_id is not null and public.is_doctor_profile_owner(doctor_id))
  or public.is_platform_admin()
);

drop policy if exists "Platform admins can manage payments" on public.payments;
create policy "Platform admins can manage payments"
on public.payments
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Invoice owners can read invoices" on public.invoices;
create policy "Invoice owners can read invoices"
on public.invoices
for select
to authenticated
using (
  (doctor_id is not null and public.is_doctor_profile_owner(doctor_id))
  or public.is_platform_admin()
);

drop policy if exists "Platform admins can manage invoices" on public.invoices;
create policy "Platform admins can manage invoices"
on public.invoices
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
on public.notifications
for select
to authenticated
using (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
on public.notifications
for update
to authenticated
using (public.is_profile_owner(user_id) or public.is_platform_admin())
with check (public.is_profile_owner(user_id) or public.is_platform_admin());

drop policy if exists "Platform admins can create notifications" on public.notifications;
create policy "Platform admins can create notifications"
on public.notifications
for insert
to authenticated
with check (public.is_platform_admin());

drop policy if exists "Platform admins can read audit logs" on public.audit_logs;
create policy "Platform admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists "Platform admins can create audit logs" on public.audit_logs;
create policy "Platform admins can create audit logs"
on public.audit_logs
for insert
to authenticated
with check (public.is_platform_admin());
