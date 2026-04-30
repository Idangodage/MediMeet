create table if not exists public.patient_favourite_doctors (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint patient_favourite_doctors_unique unique (patient_id, doctor_id)
);

create index if not exists patient_favourite_doctors_patient_created_idx
on public.patient_favourite_doctors (patient_id, created_at desc);

create index if not exists patient_favourite_doctors_doctor_idx
on public.patient_favourite_doctors (doctor_id);

alter table public.patient_favourite_doctors enable row level security;

drop policy if exists "patient_favourite_doctors_select_own_or_admin"
on public.patient_favourite_doctors;
create policy "patient_favourite_doctors_select_own_or_admin"
on public.patient_favourite_doctors
for select
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_platform_admin()
);

drop policy if exists "patient_favourite_doctors_insert_own"
on public.patient_favourite_doctors;
create policy "patient_favourite_doctors_insert_own"
on public.patient_favourite_doctors
for insert
to authenticated
with check (public.is_patient_profile_owner(patient_id));

drop policy if exists "patient_favourite_doctors_delete_own_or_admin"
on public.patient_favourite_doctors;
create policy "patient_favourite_doctors_delete_own_or_admin"
on public.patient_favourite_doctors
for delete
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_platform_admin()
);

drop policy if exists "doctor_profiles_select_patient_appointments_or_favourites"
on public.doctor_profiles;
create policy "doctor_profiles_select_patient_appointments_or_favourites"
on public.doctor_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments a
    where a.doctor_id = doctor_profiles.id
      and public.is_patient_profile_owner(a.patient_id)
  )
  or exists (
    select 1
    from public.patient_favourite_doctors pfd
    where pfd.doctor_id = doctor_profiles.id
      and public.is_patient_profile_owner(pfd.patient_id)
  )
);

drop policy if exists "doctor_locations_select_patient_appointments"
on public.doctor_locations;
create policy "doctor_locations_select_patient_appointments"
on public.doctor_locations
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments a
    where a.location_id = doctor_locations.id
      and public.is_patient_profile_owner(a.patient_id)
  )
);

drop policy if exists "clinic_locations_select_patient_appointments"
on public.clinic_locations;
create policy "clinic_locations_select_patient_appointments"
on public.clinic_locations
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments a
    join public.doctor_locations dl on dl.id = a.location_id
    where dl.clinic_location_id = clinic_locations.id
      and public.is_patient_profile_owner(a.patient_id)
  )
);

create or replace function public.cancel_patient_appointment(
  target_appointment_id uuid,
  cancellation_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_appointment public.appointments%rowtype;
  appointment_start timestamptz;
  selected_doctor_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to cancel an appointment.';
  end if;

  if public.get_user_role() <> 'patient' then
    raise exception 'Only patients can cancel patient appointments.';
  end if;

  select *
  into selected_appointment
  from public.appointments a
  where a.id = target_appointment_id
  for update;

  if selected_appointment.id is null then
    raise exception 'Appointment was not found.';
  end if;

  if not public.is_patient_profile_owner(selected_appointment.patient_id) then
    raise exception 'You can cancel only your own appointments.';
  end if;

  if selected_appointment.status::text not in ('requested', 'pending', 'confirmed') then
    raise exception 'Only requested, pending, or confirmed appointments can be cancelled.';
  end if;

  appointment_start := (
    selected_appointment.appointment_date::timestamp
      + selected_appointment.start_time
  )::timestamptz;

  if appointment_start <= now() then
    raise exception 'Past appointments cannot be cancelled.';
  end if;

  update public.appointments
  set
    status = 'cancelled_by_patient',
    cancellation_reason = nullif(trim(cancellation_reason), ''),
    cancelled_by = auth.uid()
  where id = selected_appointment.id;

  if selected_appointment.slot_id is not null then
    update public.appointment_slots
    set status = 'available'
    where id = selected_appointment.slot_id
      and status = 'booked'
      and start_time > now();
  end if;

  select dp.user_id
  into selected_doctor_user_id
  from public.doctor_profiles dp
  where dp.id = selected_appointment.doctor_id;

  if selected_doctor_user_id is not null then
    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      read_status
    )
    values (
      selected_doctor_user_id,
      'Appointment cancelled',
      'A patient cancelled an appointment scheduled for '
        || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
        || '.',
      'appointment',
      'unread'
    );
  end if;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    read_status
  )
  values (
    auth.uid(),
    'Appointment cancelled',
    'Your appointment scheduled for '
      || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
      || ' was cancelled.',
    'appointment',
    'unread'
  );
end;
$$;

grant execute on function public.cancel_patient_appointment(uuid, text)
to authenticated;
