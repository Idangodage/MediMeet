create or replace function public.is_public_verified_doctor_location(
  target_location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_locations dl
    where dl.id = target_location_id
      and dl.is_active = true
      and public.is_public_verified_doctor(dl.doctor_id)
  )
$$;

drop policy if exists "doctor_locations_select_public_anon" on public.doctor_locations;
create policy "doctor_locations_select_public_anon"
on public.doctor_locations
for select
to anon
using (
  is_active = true
  and public.is_public_verified_doctor(doctor_id)
);

drop policy if exists "clinic_locations_select_public_doctor_location_anon" on public.clinic_locations;
create policy "clinic_locations_select_public_doctor_location_anon"
on public.clinic_locations
for select
to anon
using (
  exists (
    select 1
    from public.doctor_locations dl
    where dl.clinic_location_id = clinic_locations.id
      and dl.is_active = true
      and public.is_public_verified_doctor(dl.doctor_id)
  )
);

drop policy if exists "doctor_availability_select_public_anon" on public.doctor_availability;
create policy "doctor_availability_select_public_anon"
on public.doctor_availability
for select
to anon
using (
  is_active = true
  and date >= current_date
  and public.is_public_verified_doctor(doctor_id)
);

drop policy if exists "appointment_slots_select_public_available_anon" on public.appointment_slots;
create policy "appointment_slots_select_public_available_anon"
on public.appointment_slots
for select
to anon
using (
  status = 'available'
  and start_time > now()
  and public.is_public_verified_doctor(doctor_id)
);

drop policy if exists "reviews_select_public_anon" on public.reviews;
create policy "reviews_select_public_anon"
on public.reviews
for select
to anon
using (is_public = true);

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

  select cl.clinic_id
  into selected_clinic_id
  from public.clinic_locations cl
  where cl.id = selected_location.clinic_location_id;

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

  return created_appointment_id;
end;
$$;
