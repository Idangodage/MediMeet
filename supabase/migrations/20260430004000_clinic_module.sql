insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'clinic-logos',
  'clinic-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clinic logos are publicly readable" on storage.objects;
create policy "Clinic logos are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'clinic-logos');

drop policy if exists "Clinic admins can upload clinic logos" on storage.objects;
create policy "Clinic admins can upload clinic logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'clinic-logos'
  and public.is_clinic_admin(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Clinic admins can update clinic logos" on storage.objects;
create policy "Clinic admins can update clinic logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'clinic-logos'
  and public.is_clinic_admin(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'clinic-logos'
  and public.is_clinic_admin(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Clinic admins can delete clinic logos" on storage.objects;
create policy "Clinic admins can delete clinic logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'clinic-logos'
  and public.is_clinic_admin(((storage.foldername(name))[1])::uuid)
);

create or replace function public.clinic_has_effective_clinic_plan(
  target_clinic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.clinic_id = target_clinic_id
      and public.normalize_subscription_plan_name(s.plan_name) = 'clinic'
      and public.is_subscription_effective(s.status, s.current_period_end)
  )
$$;

create or replace function public.enforce_clinic_plan_for_multiple_doctors()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_doctor_count integer;
begin
  if new.status not in ('pending', 'active') then
    return new;
  end if;

  select count(distinct dcm.doctor_id)
  into active_doctor_count
  from public.doctor_clinic_memberships dcm
  where dcm.clinic_id = new.clinic_id
    and dcm.status in ('pending', 'active')
    and dcm.id is distinct from new.id;

  if active_doctor_count >= 1
    and not public.clinic_has_effective_clinic_plan(new.clinic_id) then
    raise exception 'Clinic Plan is required before adding multiple doctors.';
  end if;

  return new;
end;
$$;

drop trigger if exists doctor_clinic_memberships_enforce_clinic_plan
on public.doctor_clinic_memberships;
create trigger doctor_clinic_memberships_enforce_clinic_plan
before insert or update of status, clinic_id, doctor_id
on public.doctor_clinic_memberships
for each row execute function public.enforce_clinic_plan_for_multiple_doctors();

create or replace function public.create_clinic_profile_for_current_admin(
  clinic_name text,
  clinic_email text default null,
  clinic_phone text default null,
  clinic_website text default null,
  clinic_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clinic_id uuid;
begin
  if public.get_user_role() <> 'clinic_admin' then
    raise exception 'Only clinic admins can create a clinic profile.';
  end if;

  if exists (
    select 1
    from public.clinic_admin_memberships cam
    where cam.user_id = auth.uid()
      and cam.status = 'active'
  ) then
    raise exception 'You already manage an active clinic.';
  end if;

  insert into public.clinics (
    name,
    email,
    phone,
    website,
    description
  )
  values (
    nullif(trim(clinic_name), ''),
    nullif(trim(clinic_email), ''),
    nullif(trim(clinic_phone), ''),
    nullif(trim(clinic_website), ''),
    nullif(trim(clinic_description), '')
  )
  returning id into new_clinic_id;

  insert into public.clinic_admin_memberships (
    user_id,
    clinic_id,
    role,
    status
  )
  values (
    auth.uid(),
    new_clinic_id,
    'owner',
    'active'
  );

  return new_clinic_id;
end;
$$;

create or replace function public.clinic_invite_doctor(
  target_clinic_id uuid,
  doctor_email text default null,
  doctor_registration_number text default null,
  target_role public.membership_role default 'doctor'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_doctor_id uuid;
  target_doctor_user_id uuid;
  membership_id uuid;
begin
  if not public.is_clinic_admin(target_clinic_id) then
    raise exception 'You can invite doctors only to clinics you manage.';
  end if;

  if nullif(trim(coalesce(doctor_email, '')), '') is null
    and nullif(trim(coalesce(doctor_registration_number, '')), '') is null then
    raise exception 'Enter a doctor email or registration number.';
  end if;

  select dp.id, dp.user_id
  into target_doctor_id, target_doctor_user_id
  from public.doctor_profiles dp
  join public.profiles p on p.id = dp.user_id
  where (
      nullif(trim(coalesce(doctor_email, '')), '') is not null
      and lower(p.email) = lower(trim(doctor_email))
    )
    or (
      nullif(trim(coalesce(doctor_registration_number, '')), '') is not null
      and lower(dp.registration_number) = lower(trim(doctor_registration_number))
    )
  order by dp.created_at desc
  limit 1;

  if target_doctor_id is null then
    raise exception 'No doctor profile matched that email or registration number.';
  end if;

  insert into public.doctor_clinic_memberships (
    doctor_id,
    clinic_id,
    role,
    status
  )
  values (
    target_doctor_id,
    target_clinic_id,
    target_role,
    'pending'
  )
  on conflict (doctor_id, clinic_id) do update
  set
    role = excluded.role,
    status = 'pending'
  returning id into membership_id;

  insert into public.notifications (
    user_id,
    title,
    body,
    type
  )
  values (
    target_doctor_user_id,
    'Clinic invitation',
    'A clinic admin invited you to join a clinic on MediMeet.',
    'system'
  );

  return membership_id;
end;
$$;
