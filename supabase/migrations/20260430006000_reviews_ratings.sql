create or replace function public.enforce_doctor_profile_update_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_platform_admin() then
    return new;
  end if;

  if current_setting('app.trusted_average_rating_update', true) = 'true' then
    if new.average_rating is distinct from old.average_rating
      and new.verification_status is not distinct from old.verification_status then
      return new;
    end if;
  end if;

  if new.verification_status is distinct from old.verification_status then
    raise exception 'Only platform admins can change doctor verification status.';
  end if;

  if new.average_rating is distinct from old.average_rating then
    raise exception 'Only platform admins or trusted backend jobs can change doctor average rating.';
  end if;

  return new;
end;
$$;

create or replace function public.refresh_doctor_average_rating(
  target_doctor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_average numeric(3, 2);
begin
  select coalesce(round(avg(r.rating)::numeric, 2), 0)::numeric(3, 2)
  into next_average
  from public.reviews r
  where r.doctor_id = target_doctor_id;

  perform set_config('app.trusted_average_rating_update', 'true', true);

  update public.doctor_profiles
  set average_rating = next_average
  where id = target_doctor_id;

  perform set_config('app.trusted_average_rating_update', 'false', true);
end;
$$;

create or replace function public.reviews_refresh_doctor_average_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_doctor_average_rating(old.doctor_id);
    return old;
  end if;

  perform public.refresh_doctor_average_rating(new.doctor_id);

  if tg_op = 'UPDATE' and new.doctor_id is distinct from old.doctor_id then
    perform public.refresh_doctor_average_rating(old.doctor_id);
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_refresh_doctor_average_rating
on public.reviews;
create trigger reviews_refresh_doctor_average_rating
after insert or update or delete on public.reviews
for each row execute function public.reviews_refresh_doctor_average_rating();

create or replace function public.create_patient_review(
  target_appointment_id uuid,
  target_rating integer,
  review_comment text default null,
  make_comment_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_patient_id uuid;
  appointment_record public.appointments%rowtype;
  created_review_id uuid;
begin
  if auth.uid() is null or public.get_user_role() <> 'patient' then
    raise exception 'Only signed-in patients can create reviews.';
  end if;

  if target_rating < 1 or target_rating > 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;

  select pp.id
  into current_patient_id
  from public.patient_profiles pp
  where pp.user_id = auth.uid()
  limit 1;

  if current_patient_id is null then
    raise exception 'Complete patient onboarding before leaving reviews.';
  end if;

  select *
  into appointment_record
  from public.appointments
  where id = target_appointment_id
  for update;

  if not found then
    raise exception 'Appointment not found.';
  end if;

  if appointment_record.patient_id <> current_patient_id then
    raise exception 'You can review only your own appointments.';
  end if;

  if appointment_record.status <> 'completed' then
    raise exception 'Only completed appointments can be reviewed.';
  end if;

  insert into public.reviews (
    appointment_id,
    patient_id,
    doctor_id,
    rating,
    comment,
    is_public
  )
  values (
    appointment_record.id,
    appointment_record.patient_id,
    appointment_record.doctor_id,
    target_rating,
    nullif(trim(coalesce(review_comment, '')), ''),
    make_comment_public
  )
  returning id into created_review_id;

  return created_review_id;
exception
  when unique_violation then
    raise exception 'This completed appointment already has a review.';
end;
$$;

create or replace function public.admin_hide_review(
  target_review_id uuid,
  moderation_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row public.reviews%rowtype;
  after_row public.reviews%rowtype;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception 'Only platform admins can hide reviews.';
  end if;

  select *
  into before_row
  from public.reviews
  where id = target_review_id
  for update;

  if not found then
    raise exception 'Review not found.';
  end if;

  update public.reviews
  set is_public = false
  where id = target_review_id
  returning * into after_row;

  insert into public.audit_logs (
    actor_user_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    auth.uid(),
    'review_hidden',
    'reviews',
    target_review_id,
    jsonb_build_object(
      'note', nullif(trim(coalesce(moderation_note, '')), ''),
      'old_row', to_jsonb(before_row),
      'new_row', to_jsonb(after_row)
    )
  );
end;
$$;

grant execute on function public.create_patient_review(uuid, integer, text, boolean)
to authenticated;

grant execute on function public.admin_hide_review(uuid, text)
to authenticated;

revoke execute on function public.refresh_doctor_average_rating(uuid)
from anon, authenticated;

revoke execute on function public.reviews_refresh_doctor_average_rating()
from anon, authenticated;
