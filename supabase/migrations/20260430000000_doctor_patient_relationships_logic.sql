create or replace function public.record_completed_doctor_patient_relationship(
  target_doctor_id uuid,
  target_patient_id uuid,
  target_visit_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_doctor_id is null
    or target_patient_id is null
    or target_visit_date is null then
    raise exception 'Doctor, patient, and visit date are required.';
  end if;

  insert into public.doctor_patient_relationships (
    doctor_id,
    patient_id,
    first_visit_date,
    last_visit_date,
    total_visits,
    relationship_status
  )
  values (
    target_doctor_id,
    target_patient_id,
    target_visit_date,
    target_visit_date,
    1,
    'active'
  )
  on conflict (doctor_id, patient_id)
  do update set
    first_visit_date = least(
      coalesce(public.doctor_patient_relationships.first_visit_date, excluded.first_visit_date),
      excluded.first_visit_date
    ),
    last_visit_date = greatest(
      coalesce(public.doctor_patient_relationships.last_visit_date, excluded.last_visit_date),
      excluded.last_visit_date
    ),
    total_visits = public.doctor_patient_relationships.total_visits + 1,
    relationship_status = 'active';
end;
$$;

create or replace function public.doctor_mark_appointment_completed(
  target_appointment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_appointment public.appointments%rowtype;
  appointment_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if public.get_user_role() <> 'doctor' then
    raise exception 'Only doctors can complete appointments.';
  end if;

  select *
  into selected_appointment
  from public.appointments a
  where a.id = target_appointment_id
  for update;

  if selected_appointment.id is null then
    raise exception 'Appointment was not found.';
  end if;

  if not public.is_doctor_profile_owner(selected_appointment.doctor_id) then
    raise exception 'You can manage only your own appointments.';
  end if;

  if selected_appointment.status::text not in ('requested', 'pending', 'confirmed') then
    raise exception 'Only active appointments can be marked completed.';
  end if;

  appointment_start := (
    selected_appointment.appointment_date::timestamp
      + selected_appointment.start_time
  )::timestamptz;

  if appointment_start > now() then
    raise exception 'Future appointments cannot be marked completed.';
  end if;

  update public.appointments
  set status = 'completed'
  where id = selected_appointment.id;

  perform public.record_completed_doctor_patient_relationship(
    selected_appointment.doctor_id,
    selected_appointment.patient_id,
    selected_appointment.appointment_date
  );

  perform public.notify_appointment_patient(
    selected_appointment.patient_id,
    'Appointment completed',
    'Your appointment on '
      || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
      || ' was marked completed.'
  );
end;
$$;

drop policy if exists "doctor_profiles_select_patient_relationships"
on public.doctor_profiles;

create policy "doctor_profiles_select_patient_relationships"
on public.doctor_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.doctor_patient_relationships dpr
    where dpr.doctor_id = doctor_profiles.id
      and dpr.relationship_status = 'active'
      and public.is_patient_profile_owner(dpr.patient_id)
  )
);

revoke execute on function public.record_completed_doctor_patient_relationship(uuid, uuid, date)
from public;
