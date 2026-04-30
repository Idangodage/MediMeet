create or replace function public.doctor_availability_has_booking_history(
  target_availability_id uuid
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
    join public.appointment_slots s on s.id = a.slot_id
    where s.availability_id = target_availability_id
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
      and a.status not in ('cancelled', 'rescheduled')
  )
$$;

create or replace function public.assert_doctor_availability_input(
  target_date date,
  target_start_time time,
  target_end_time time,
  target_appointment_duration_minutes integer,
  target_break_minutes integer,
  target_max_patients integer
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_date < current_date then
    raise exception 'Availability cannot be created or edited in the past.';
  end if;

  if target_start_time >= target_end_time then
    raise exception 'Start time must be before end time.';
  end if;

  if target_appointment_duration_minutes <= 0 then
    raise exception 'Appointment duration must be greater than zero.';
  end if;

  if target_break_minutes < 0 then
    raise exception 'Break time cannot be negative.';
  end if;

  if target_max_patients <= 0 then
    raise exception 'Maximum patients must be greater than zero.';
  end if;

  if (
    (target_date::timestamp + target_start_time)
    + make_interval(mins => target_appointment_duration_minutes)
  ) > (target_date::timestamp + target_end_time) then
    raise exception 'Availability window is too short for one appointment slot.';
  end if;
end;
$$;

create or replace function public.get_owned_doctor_id_for_location(
  target_location_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  owned_doctor_id uuid;
begin
  select dp.id
  into owned_doctor_id
  from public.doctor_profiles dp
  join public.doctor_locations dl on dl.doctor_id = dp.id
  where dl.id = target_location_id
    and dl.is_active = true
    and dp.user_id = auth.uid();

  if owned_doctor_id is null then
    raise exception 'You can only manage availability for your own active locations.';
  end if;

  return owned_doctor_id;
end;
$$;

create or replace function public.assert_no_overlapping_doctor_availability(
  target_doctor_id uuid,
  target_date date,
  target_start_time time,
  target_end_time time,
  target_is_active boolean,
  ignored_availability_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_is_active = false then
    return;
  end if;

  if exists (
    select 1
    from public.doctor_availability da
    where da.doctor_id = target_doctor_id
      and da.date = target_date
      and da.is_active = true
      and (ignored_availability_id is null or da.id <> ignored_availability_id)
      and target_start_time < da.end_time
      and target_end_time > da.start_time
  ) then
    raise exception 'Availability overlaps with an existing active availability window.';
  end if;
end;
$$;

create or replace function public.generate_appointment_slots_for_availability(
  target_availability_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  availability_record public.doctor_availability%rowtype;
  slot_start timestamptz;
  slot_end timestamptz;
  availability_end timestamptz;
  step_interval interval;
  generated_count integer := 0;
begin
  select *
  into availability_record
  from public.doctor_availability
  where id = target_availability_id;

  if availability_record.id is null then
    raise exception 'Availability not found.';
  end if;

  slot_start := (
    availability_record.date::timestamp + availability_record.start_time
  )::timestamptz;
  availability_end := (
    availability_record.date::timestamp + availability_record.end_time
  )::timestamptz;
  step_interval := make_interval(
    mins => availability_record.appointment_duration_minutes
      + availability_record.break_minutes
  );

  while slot_start + make_interval(
    mins => availability_record.appointment_duration_minutes
  ) <= availability_end loop
    slot_end := slot_start + make_interval(
      mins => availability_record.appointment_duration_minutes
    );

    insert into public.appointment_slots (
      doctor_id,
      availability_id,
      start_time,
      end_time,
      status
    )
    values (
      availability_record.doctor_id,
      availability_record.id,
      slot_start,
      slot_end,
      case
        when availability_record.is_active then 'available'::public.slot_status
        else 'blocked'::public.slot_status
      end
    );

    generated_count := generated_count + 1;
    slot_start := slot_start + step_interval;
  end loop;

  if generated_count = 0 then
    raise exception 'No slots were generated for this availability window.';
  end if;

  return generated_count;
end;
$$;

create or replace function public.create_doctor_availability_with_slots(
  target_location_id uuid,
  target_date date,
  target_start_time time,
  target_end_time time,
  target_appointment_duration_minutes integer,
  target_break_minutes integer,
  target_max_patients integer,
  target_consultation_type public.consultation_type,
  target_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  owned_doctor_id uuid;
  new_availability_id uuid;
begin
  perform public.assert_doctor_availability_input(
    target_date,
    target_start_time,
    target_end_time,
    target_appointment_duration_minutes,
    target_break_minutes,
    target_max_patients
  );

  owned_doctor_id := public.get_owned_doctor_id_for_location(target_location_id);

  perform public.assert_no_overlapping_doctor_availability(
    owned_doctor_id,
    target_date,
    target_start_time,
    target_end_time,
    target_is_active
  );

  insert into public.doctor_availability (
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
  values (
    owned_doctor_id,
    target_location_id,
    target_date,
    target_start_time,
    target_end_time,
    target_appointment_duration_minutes,
    target_break_minutes,
    target_max_patients,
    target_consultation_type,
    target_is_active
  )
  returning id into new_availability_id;

  perform public.generate_appointment_slots_for_availability(new_availability_id);

  return new_availability_id;
end;
$$;

create or replace function public.update_doctor_availability_with_slots(
  target_availability_id uuid,
  target_location_id uuid,
  target_date date,
  target_start_time time,
  target_end_time time,
  target_appointment_duration_minutes integer,
  target_break_minutes integer,
  target_max_patients integer,
  target_consultation_type public.consultation_type,
  target_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_record public.doctor_availability%rowtype;
  owned_doctor_id uuid;
begin
  select *
  into existing_record
  from public.doctor_availability
  where id = target_availability_id;

  if existing_record.id is null then
    raise exception 'Availability not found.';
  end if;

  if not public.is_doctor_profile_owner(existing_record.doctor_id) then
    raise exception 'You can only edit your own availability.';
  end if;

  if existing_record.date < current_date then
    raise exception 'Past availability cannot be edited.';
  end if;

  if public.doctor_availability_has_booking_history(target_availability_id) then
    raise exception 'Availability with booking history cannot be edited until rescheduling logic exists.';
  end if;

  perform public.assert_doctor_availability_input(
    target_date,
    target_start_time,
    target_end_time,
    target_appointment_duration_minutes,
    target_break_minutes,
    target_max_patients
  );

  owned_doctor_id := public.get_owned_doctor_id_for_location(target_location_id);

  if owned_doctor_id <> existing_record.doctor_id then
    raise exception 'Location does not belong to this doctor.';
  end if;

  perform public.assert_no_overlapping_doctor_availability(
    owned_doctor_id,
    target_date,
    target_start_time,
    target_end_time,
    target_is_active,
    target_availability_id
  );

  delete from public.appointment_slots
  where availability_id = target_availability_id;

  update public.doctor_availability
  set
    location_id = target_location_id,
    date = target_date,
    start_time = target_start_time,
    end_time = target_end_time,
    appointment_duration_minutes = target_appointment_duration_minutes,
    break_minutes = target_break_minutes,
    max_patients = target_max_patients,
    consultation_type = target_consultation_type,
    is_active = target_is_active
  where id = target_availability_id;

  perform public.generate_appointment_slots_for_availability(target_availability_id);

  return target_availability_id;
end;
$$;

create or replace function public.delete_doctor_availability_if_unbooked(
  target_availability_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_record public.doctor_availability%rowtype;
begin
  select *
  into existing_record
  from public.doctor_availability
  where id = target_availability_id;

  if existing_record.id is null then
    raise exception 'Availability not found.';
  end if;

  if not public.is_doctor_profile_owner(existing_record.doctor_id) then
    raise exception 'You can only delete your own availability.';
  end if;

  if public.doctor_availability_has_booking_history(target_availability_id) then
    raise exception 'Availability with booking history cannot be deleted.';
  end if;

  delete from public.doctor_availability
  where id = target_availability_id;
end;
$$;

create or replace function public.update_doctor_slot_status(
  target_slot_id uuid,
  target_status public.slot_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_slot public.appointment_slots%rowtype;
begin
  if target_status not in ('available', 'blocked') then
    raise exception 'Doctors can only mark slots available or blocked.';
  end if;

  select *
  into existing_slot
  from public.appointment_slots
  where id = target_slot_id;

  if existing_slot.id is null then
    raise exception 'Slot not found.';
  end if;

  if not public.is_doctor_profile_owner(existing_slot.doctor_id) then
    raise exception 'You can only update your own slots.';
  end if;

  if existing_slot.start_time <= now() then
    raise exception 'Past slots cannot be updated.';
  end if;

  if public.doctor_slot_has_active_booking(target_slot_id) then
    raise exception 'Booked slots cannot be edited until rescheduling logic exists.';
  end if;

  update public.appointment_slots
  set status = target_status
  where id = target_slot_id;
end;
$$;
