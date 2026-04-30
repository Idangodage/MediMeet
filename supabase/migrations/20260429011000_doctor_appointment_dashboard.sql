create or replace function public.get_owned_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select dp.id
  from public.doctor_profiles dp
  where dp.user_id = auth.uid()
  limit 1
$$;

create or replace function public.notify_appointment_patient(
  target_patient_id uuid,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_user_id uuid;
begin
  select pp.user_id
  into patient_user_id
  from public.patient_profiles pp
  where pp.id = target_patient_id;

  if patient_user_id is not null then
    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      read_status
    )
    values (
      patient_user_id,
      notification_title,
      notification_body,
      'appointment',
      'unread'
    );
  end if;
end;
$$;

create or replace function public.doctor_confirm_appointment(
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
    raise exception 'Only doctors can confirm appointments.';
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

  if selected_appointment.status::text not in ('requested', 'pending') then
    raise exception 'Only requested or pending appointments can be confirmed.';
  end if;

  appointment_start := (
    selected_appointment.appointment_date::timestamp
      + selected_appointment.start_time
  )::timestamptz;

  if appointment_start <= now() then
    raise exception 'Past appointments cannot be confirmed.';
  end if;

  update public.appointments
  set
    status = 'confirmed',
    cancellation_reason = null,
    cancelled_by = null
  where id = selected_appointment.id;

  perform public.notify_appointment_patient(
    selected_appointment.patient_id,
    'Appointment confirmed',
    'Your appointment scheduled for '
      || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
      || ' has been confirmed.'
  );
end;
$$;

create or replace function public.doctor_cancel_appointment(
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
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if public.get_user_role() <> 'doctor' then
    raise exception 'Only doctors can cancel doctor appointments.';
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
    raise exception 'Only requested, pending, or confirmed appointments can be cancelled.';
  end if;

  appointment_start := (
    selected_appointment.appointment_date::timestamp
      + selected_appointment.start_time
  )::timestamptz;

  if appointment_start <= now() then
    raise exception 'Past appointments cannot be cancelled. Mark the outcome instead.';
  end if;

  update public.appointments
  set
    status = 'cancelled_by_doctor',
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

  perform public.notify_appointment_patient(
    selected_appointment.patient_id,
    'Appointment cancelled',
    'Your doctor cancelled the appointment scheduled for '
      || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
      || '.'
  );
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

  insert into public.doctor_patient_relationships (
    doctor_id,
    patient_id,
    first_visit_date,
    last_visit_date,
    total_visits,
    relationship_status
  )
  values (
    selected_appointment.doctor_id,
    selected_appointment.patient_id,
    selected_appointment.appointment_date,
    selected_appointment.appointment_date,
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

  perform public.notify_appointment_patient(
    selected_appointment.patient_id,
    'Appointment completed',
    'Your appointment on '
      || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
      || ' was marked completed.'
  );
end;
$$;

create or replace function public.doctor_mark_patient_no_show(
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
    raise exception 'Only doctors can mark no-shows.';
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
    raise exception 'Only active appointments can be marked no-show.';
  end if;

  appointment_start := (
    selected_appointment.appointment_date::timestamp
      + selected_appointment.start_time
  )::timestamptz;

  if appointment_start > now() then
    raise exception 'Future appointments cannot be marked no-show.';
  end if;

  update public.appointments
  set status = 'no_show'
  where id = selected_appointment.id;

  perform public.notify_appointment_patient(
    selected_appointment.patient_id,
    'Appointment marked no-show',
    'Your appointment on '
      || to_char(appointment_start, 'YYYY-MM-DD HH24:MI')
      || ' was marked as no-show.'
  );
end;
$$;

create or replace function public.doctor_reschedule_appointment(
  target_appointment_id uuid,
  target_slot_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_appointment public.appointments%rowtype;
  selected_slot public.appointment_slots%rowtype;
  selected_availability public.doctor_availability%rowtype;
  selected_location public.doctor_locations%rowtype;
  selected_clinic_id uuid;
  old_appointment_start timestamptz;
  new_appointment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if public.get_user_role() <> 'doctor' then
    raise exception 'Only doctors can reschedule appointments.';
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
    raise exception 'Only active appointments can be rescheduled.';
  end if;

  old_appointment_start := (
    selected_appointment.appointment_date::timestamp
      + selected_appointment.start_time
  )::timestamptz;

  if old_appointment_start <= now() then
    raise exception 'Past appointments cannot be rescheduled.';
  end if;

  select *
  into selected_slot
  from public.appointment_slots s
  where s.id = target_slot_id
  for update;

  if selected_slot.id is null then
    raise exception 'Target slot was not found.';
  end if;

  if selected_slot.doctor_id <> selected_appointment.doctor_id then
    raise exception 'Target slot must belong to the same doctor.';
  end if;

  if selected_slot.status <> 'available' or selected_slot.start_time <= now() then
    raise exception 'Target slot is no longer available.';
  end if;

  if public.doctor_slot_has_active_booking(selected_slot.id) then
    raise exception 'Target slot already has an active booking.';
  end if;

  select *
  into selected_availability
  from public.doctor_availability da
  where da.id = selected_slot.availability_id
    and da.is_active = true;

  if selected_availability.id is null then
    raise exception 'Target availability is no longer active.';
  end if;

  select *
  into selected_location
  from public.doctor_locations dl
  where dl.id = selected_availability.location_id
    and dl.is_active = true;

  if selected_location.id is null then
    raise exception 'Target location is no longer active.';
  end if;

  select cl.clinic_id
  into selected_clinic_id
  from public.clinic_locations cl
  where cl.id = selected_location.clinic_location_id;

  if exists (
    select 1
    from public.appointments a
    where a.patient_id = selected_appointment.patient_id
      and a.doctor_id = selected_appointment.doctor_id
      and a.appointment_date = selected_slot.start_time::date
      and a.start_time = selected_slot.start_time::time
      and a.status::text not in (
        'cancelled',
        'cancelled_by_patient',
        'cancelled_by_doctor',
        'rescheduled'
      )
  ) then
    raise exception 'Patient already has an active appointment with this doctor at that time.';
  end if;

  update public.appointments
  set status = 'rescheduled'
  where id = selected_appointment.id;

  if selected_appointment.slot_id is not null then
    update public.appointment_slots
    set status = 'available'
    where id = selected_appointment.slot_id
      and status = 'booked'
      and start_time > now();
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
    status,
    rescheduled_from
  )
  values (
    selected_appointment.patient_id,
    selected_appointment.doctor_id,
    selected_clinic_id,
    selected_location.id,
    selected_slot.id,
    selected_slot.start_time::date,
    selected_slot.start_time::time,
    selected_slot.end_time::time,
    selected_appointment.reason_for_visit,
    'confirmed',
    selected_appointment.id
  )
  returning id into new_appointment_id;

  update public.appointment_slots
  set status = 'booked'
  where id = selected_slot.id;

  perform public.notify_appointment_patient(
    selected_appointment.patient_id,
    'Appointment rescheduled',
    'Your appointment was moved from '
      || to_char(old_appointment_start, 'YYYY-MM-DD HH24:MI')
      || ' to '
      || to_char(selected_slot.start_time, 'YYYY-MM-DD HH24:MI')
      || '.'
  );

  return new_appointment_id;
end;
$$;

revoke execute on function public.notify_appointment_patient(uuid, text, text)
from public;

revoke execute on function public.get_owned_doctor_id()
from public;

revoke execute on function public.doctor_confirm_appointment(uuid)
from public;

revoke execute on function public.doctor_cancel_appointment(uuid, text)
from public;

revoke execute on function public.doctor_mark_appointment_completed(uuid)
from public;

revoke execute on function public.doctor_mark_patient_no_show(uuid)
from public;

revoke execute on function public.doctor_reschedule_appointment(uuid, uuid)
from public;

grant execute on function public.get_owned_doctor_id()
to authenticated;

grant execute on function public.doctor_confirm_appointment(uuid)
to authenticated;

grant execute on function public.doctor_cancel_appointment(uuid, text)
to authenticated;

grant execute on function public.doctor_mark_appointment_completed(uuid)
to authenticated;

grant execute on function public.doctor_mark_patient_no_show(uuid)
to authenticated;

grant execute on function public.doctor_reschedule_appointment(uuid, uuid)
to authenticated;
