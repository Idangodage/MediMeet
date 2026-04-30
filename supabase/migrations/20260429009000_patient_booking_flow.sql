alter type public.appointment_status add value if not exists 'requested';
alter type public.appointment_status add value if not exists 'cancelled_by_patient';
alter type public.appointment_status add value if not exists 'cancelled_by_doctor';

create or replace function public.appointment_status_text(
  value public.appointment_status
)
returns text
language sql
immutable
set search_path = public
as $$
  select $1::text
$$;

drop index if exists public.appointments_active_slot_unique_idx;
create unique index if not exists appointments_active_slot_unique_idx
on public.appointments (slot_id)
where slot_id is not null
  and public.appointment_status_text(status) not in (
    'cancelled',
    'cancelled_by_patient',
    'cancelled_by_doctor',
    'rescheduled'
  );

create unique index if not exists appointments_active_doctor_time_unique_idx
on public.appointments (doctor_id, appointment_date, start_time)
where public.appointment_status_text(status) not in (
  'cancelled',
  'cancelled_by_patient',
  'cancelled_by_doctor',
  'rescheduled'
);

create unique index if not exists appointments_active_patient_doctor_time_unique_idx
on public.appointments (patient_id, doctor_id, appointment_date, start_time)
where public.appointment_status_text(status) not in (
  'cancelled',
  'cancelled_by_patient',
  'cancelled_by_doctor',
  'rescheduled'
);

create or replace function public.is_current_doctor_for_patient(
  target_patient_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    join public.doctor_profiles dp on dp.id = a.doctor_id
    where a.patient_id = target_patient_id
      and dp.user_id = auth.uid()
      and a.status::text in ('requested', 'pending', 'confirmed', 'completed')
  )
  or exists (
    select 1
    from public.doctor_patient_relationships dpr
    join public.doctor_profiles dp on dp.id = dpr.doctor_id
    where dpr.patient_id = target_patient_id
      and dp.user_id = auth.uid()
      and dpr.relationship_status = 'active'
  )
$$;

create or replace function public.doctor_slot_has_active_booking(
  target_slot_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    where a.slot_id = target_slot_id
      and a.status::text not in (
        'cancelled',
        'cancelled_by_patient',
        'cancelled_by_doctor',
        'rescheduled'
      )
  )
$$;

create or replace function public.enforce_appointment_update_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    or public.is_platform_admin()
    or public.is_doctor_for_appointment(old.id)
    or public.is_clinic_admin_for_appointment(old.id) then
    return new;
  end if;

  if public.is_patient_for_appointment(old.id) then
    if old.status::text not in ('requested', 'pending', 'confirmed') then
      raise exception 'Only requested, pending, or confirmed appointments can be cancelled by patients.';
    end if;

    if new.status::text not in ('cancelled', 'cancelled_by_patient') then
      raise exception 'Patients can only cancel their own appointments.';
    end if;

    if new.cancelled_by is distinct from auth.uid() then
      raise exception 'Patients must mark themselves as the cancelling user.';
    end if;

    if new.patient_id is distinct from old.patient_id
      or new.doctor_id is distinct from old.doctor_id
      or new.clinic_id is distinct from old.clinic_id
      or new.location_id is distinct from old.location_id
      or new.slot_id is distinct from old.slot_id
      or new.appointment_date is distinct from old.appointment_date
      or new.start_time is distinct from old.start_time
      or new.end_time is distinct from old.end_time
      or new.reason_for_visit is distinct from old.reason_for_visit
      or new.rescheduled_from is distinct from old.rescheduled_from
      or new.created_at is distinct from old.created_at then
      raise exception 'Patients cannot change appointment details while cancelling.';
    end if;

    return new;
  end if;

  raise exception 'Not allowed to update this appointment.';
end;
$$;

drop policy if exists "appointments_update_patient_cancel_doctor_clinic_or_platform"
on public.appointments;

create policy "appointments_update_patient_cancel_doctor_clinic_or_platform"
on public.appointments
for update
to authenticated
using (
  public.is_patient_for_appointment(id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_appointment(id)
  or public.is_platform_admin()
)
with check (
  (
    public.is_patient_profile_owner(patient_id)
    and status::text in ('cancelled', 'cancelled_by_patient')
    and cancelled_by = auth.uid()
  )
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or (clinic_id is not null and public.is_clinic_admin(clinic_id))
  or public.is_platform_admin()
);

create or replace function public.book_public_appointment(
  target_slot_id uuid,
  reason_for_visit text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_profile_id uuid;
  selected_slot public.appointment_slots%rowtype;
  selected_availability public.doctor_availability%rowtype;
  selected_location public.doctor_locations%rowtype;
  selected_clinic_id uuid;
  selected_doctor_user_id uuid;
  selected_doctor_name text;
  created_appointment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to book an appointment.';
  end if;

  if public.get_user_role() <> 'patient' then
    raise exception 'Only patients can book appointments from public doctor profiles.';
  end if;

  select pp.id
  into patient_profile_id
  from public.patient_profiles pp
  where pp.user_id = auth.uid()
  limit 1;

  if patient_profile_id is null then
    raise exception 'Complete patient onboarding before booking.';
  end if;

  select *
  into selected_slot
  from public.appointment_slots s
  where s.id = target_slot_id
  for update;

  if selected_slot.id is null then
    raise exception 'Appointment slot was not found.';
  end if;

  if selected_slot.status <> 'available' or selected_slot.start_time <= now() then
    raise exception 'Appointment slot is no longer available.';
  end if;

  if not public.is_public_verified_doctor(selected_slot.doctor_id) then
    raise exception 'Doctor is not available for public booking.';
  end if;

  select *
  into selected_availability
  from public.doctor_availability da
  where da.id = selected_slot.availability_id
    and da.is_active = true;

  if selected_availability.id is null then
    raise exception 'Doctor availability is no longer active.';
  end if;

  select *
  into selected_location
  from public.doctor_locations dl
  where dl.id = selected_availability.location_id
    and dl.is_active = true;

  if selected_location.id is null then
    raise exception 'Doctor location is no longer active.';
  end if;

  select dp.user_id, dp.full_name
  into selected_doctor_user_id, selected_doctor_name
  from public.doctor_profiles dp
  where dp.id = selected_slot.doctor_id;

  if selected_doctor_user_id is null then
    raise exception 'Doctor profile is not available.';
  end if;

  select cl.clinic_id
  into selected_clinic_id
  from public.clinic_locations cl
  where cl.id = selected_location.clinic_location_id;

  if exists (
    select 1
    from public.appointments a
    where a.patient_id = patient_profile_id
      and a.doctor_id = selected_slot.doctor_id
      and a.appointment_date = selected_slot.start_time::date
      and a.start_time = selected_slot.start_time::time
      and a.status::text not in (
        'cancelled',
        'cancelled_by_patient',
        'cancelled_by_doctor',
        'rescheduled'
      )
  ) then
    raise exception 'You already have an appointment with this doctor at that time.';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.doctor_id = selected_slot.doctor_id
      and a.appointment_date = selected_slot.start_time::date
      and a.start_time = selected_slot.start_time::time
      and a.status::text not in (
        'cancelled',
        'cancelled_by_patient',
        'cancelled_by_doctor',
        'rescheduled'
      )
  ) then
    raise exception 'Doctor already has an active appointment at that time.';
  end if;

  insert into public.appointments (
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
  values (
    patient_profile_id,
    selected_slot.doctor_id,
    selected_clinic_id,
    selected_location.id,
    selected_slot.id,
    selected_slot.start_time::date,
    selected_slot.start_time::time,
    selected_slot.end_time::time,
    nullif(trim(reason_for_visit), ''),
    'confirmed'
  )
  returning id into created_appointment_id;

  update public.appointment_slots
  set status = 'booked'
  where id = selected_slot.id;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    read_status
  )
  values (
    selected_doctor_user_id,
    'New appointment booked',
    'A patient booked an appointment with you on '
      || to_char(selected_slot.start_time, 'YYYY-MM-DD HH24:MI')
      || '.',
    'appointment',
    'unread'
  );

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    read_status
  )
  values (
    auth.uid(),
    'Appointment confirmed',
    'Your appointment with '
      || coalesce(selected_doctor_name, 'your doctor')
      || ' is confirmed for '
      || to_char(selected_slot.start_time, 'YYYY-MM-DD HH24:MI')
      || '.',
    'appointment',
    'unread'
  );

  return created_appointment_id;
end;
$$;

grant execute on function public.book_public_appointment(uuid, text)
to authenticated;
