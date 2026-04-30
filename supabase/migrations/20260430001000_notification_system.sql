do $$
begin
  create type public.notification_event as enum (
    'patient_appointment_booked',
    'patient_appointment_confirmed',
    'patient_appointment_cancelled',
    'patient_appointment_rescheduled',
    'patient_appointment_reminder',
    'patient_review_request',
    'doctor_new_appointment_booking',
    'doctor_appointment_cancelled_by_patient',
    'doctor_appointment_reminder',
    'doctor_verification_approved',
    'doctor_verification_rejected',
    'doctor_subscription_payment_failed',
    'doctor_subscription_renewal_reminder',
    'clinic_new_clinic_appointment',
    'clinic_doctor_added_to_clinic',
    'clinic_subscription_warning',
    'admin_new_doctor_verification_request',
    'admin_reported_profile',
    'admin_failed_payment_event'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.notifications
add column if not exists event public.notification_event;

create index if not exists notifications_user_event_created_idx
on public.notifications (user_id, event, created_at desc);

create or replace function public.infer_notification_type(
  target_event public.notification_event
)
returns public.notification_type
language sql
immutable
set search_path = public
as $$
  select case
    when target_event::text like '%appointment%' then 'appointment'::public.notification_type
    when target_event::text like '%verification%' then 'verification'::public.notification_type
    when target_event::text like '%subscription%' then 'subscription'::public.notification_type
    when target_event::text like '%payment%' then 'payment'::public.notification_type
    else 'system'::public.notification_type
  end
$$;

create or replace function public.create_app_notification(
  target_user_id uuid,
  target_event public.notification_event,
  notification_title text,
  notification_body text,
  target_type public.notification_type default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_notification_id uuid;
begin
  if target_user_id is null then
    raise exception 'Notification user id is required.';
  end if;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    event,
    read_status
  )
  values (
    target_user_id,
    notification_title,
    notification_body,
    coalesce(target_type, public.infer_notification_type(target_event)),
    target_event,
    'unread'
  )
  returning id into created_notification_id;

  return created_notification_id;
end;
$$;

create or replace function public.populate_notification_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_role public.app_role;
begin
  if new.event is not null then
    return new;
  end if;

  select p.role
  into recipient_role
  from public.profiles p
  where p.id = new.user_id;

  if recipient_role = 'patient' and new.title ilike '%rescheduled%' then
    new.event := 'patient_appointment_rescheduled';
  elsif recipient_role = 'patient' and new.title ilike '%cancelled%' then
    new.event := 'patient_appointment_cancelled';
  elsif recipient_role = 'patient' and new.title ilike '%completed%' then
    new.event := 'patient_review_request';
  elsif recipient_role = 'patient' and new.title ilike '%confirmed%' then
    new.event := 'patient_appointment_confirmed';
  elsif recipient_role = 'doctor' and new.title ilike '%new appointment%' then
    new.event := 'doctor_new_appointment_booking';
  elsif recipient_role = 'doctor' and new.title ilike '%cancelled%' then
    new.event := 'doctor_appointment_cancelled_by_patient';
  elsif recipient_role = 'doctor' and new.title ilike '%verification approved%' then
    new.event := 'doctor_verification_approved';
  elsif recipient_role = 'doctor' and new.title ilike '%verification rejected%' then
    new.event := 'doctor_verification_rejected';
  elsif recipient_role = 'platform_admin' and new.title ilike '%verification%' then
    new.event := 'admin_new_doctor_verification_request';
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_populate_event
on public.notifications;
create trigger notifications_populate_event
before insert or update of title, event on public.notifications
for each row
execute function public.populate_notification_event();

create or replace function public.notify_appointment_patient(
  target_patient_id uuid,
  notification_title text,
  notification_body text,
  target_event public.notification_event default 'patient_appointment_confirmed'
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
    perform public.create_app_notification(
      patient_user_id,
      target_event,
      notification_title,
      notification_body
    );
  end if;
end;
$$;

create or replace function public.notify_platform_admins(
  target_event public.notification_event,
  notification_title text,
  notification_body text,
  target_type public.notification_type default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_profile record;
begin
  for admin_profile in
    select p.id
    from public.profiles p
    where p.role = 'platform_admin'
  loop
    perform public.create_app_notification(
      admin_profile.id,
      target_event,
      notification_title,
      notification_body,
      target_type
    );
  end loop;
end;
$$;

create or replace function public.notify_doctor_verification_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
    and new.verification_status in ('approved', 'rejected') then
    perform public.create_app_notification(
      new.user_id,
      case
        when new.verification_status = 'approved'
          then 'doctor_verification_approved'::public.notification_event
        else 'doctor_verification_rejected'::public.notification_event
      end,
      case
        when new.verification_status = 'approved'
          then 'Verification approved'
        else 'Verification rejected'
      end,
      case
        when new.verification_status = 'approved'
          then 'Your doctor profile verification was approved.'
        else 'Your doctor profile verification was rejected. Review the admin note and upload updates.'
      end,
      'verification'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists doctor_profiles_notify_verification_status
on public.doctor_profiles;
create trigger doctor_profiles_notify_verification_status
after update of verification_status on public.doctor_profiles
for each row
execute function public.notify_doctor_verification_status_change();

create or replace function public.notify_admin_doctor_verification_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  doctor_name text;
begin
  if new.status::text = 'pending' then
    select dp.full_name
    into doctor_name
    from public.doctor_profiles dp
    where dp.id = new.doctor_id;

    perform public.notify_platform_admins(
      'admin_new_doctor_verification_request',
      'New doctor verification request',
      coalesce(doctor_name, 'A doctor')
        || ' uploaded a verification document for review.',
      'verification'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists doctor_documents_notify_admin_verification_request
on public.doctor_verification_documents;
create trigger doctor_documents_notify_admin_verification_request
after insert on public.doctor_verification_documents
for each row
execute function public.notify_admin_doctor_verification_request();

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
      || ' has been confirmed.',
    'patient_appointment_confirmed'
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
      || '.',
    'patient_appointment_cancelled'
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
      || ' was marked completed.',
    'patient_review_request'
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
      || ' was marked as no-show.',
    'patient_appointment_cancelled'
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
      || '.',
    'patient_appointment_rescheduled'
  );

  return new_appointment_id;
end;
$$;

revoke execute on function public.create_app_notification(uuid, public.notification_event, text, text, public.notification_type)
from public;

revoke execute on function public.notify_appointment_patient(uuid, text, text, public.notification_event)
from public;

revoke execute on function public.notify_platform_admins(public.notification_event, text, text, public.notification_type)
from public;

revoke execute on function public.populate_notification_event()
from public;

revoke execute on function public.notify_doctor_verification_status_change()
from public;

revoke execute on function public.notify_admin_doctor_verification_request()
from public;
