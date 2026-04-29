create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
  requested_role_text text;
begin
  requested_role_text := nullif(new.raw_user_meta_data ->> 'role', '');

  if requested_role_text in ('patient', 'doctor', 'clinic_admin') then
    requested_role := requested_role_text::public.app_role;
  else
    requested_role := 'patient';
  end if;

  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    requested_role
  )
  on conflict (id) do update
  set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    email = excluded.email,
    phone = coalesce(public.profiles.phone, excluded.phone),
    role = excluded.role;

  return new;
end;
$$;

create or replace function public.complete_clinic_admin_onboarding(
  clinic_name text,
  clinic_email text,
  clinic_phone text,
  location_address text,
  location_city text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_clinic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if public.get_user_role() <> 'clinic_admin' then
    raise exception 'Only clinic admins can complete clinic onboarding.';
  end if;

  if nullif(trim(clinic_name), '') is null then
    raise exception 'Clinic name is required.';
  end if;

  if nullif(trim(location_address), '') is null then
    raise exception 'Clinic location address is required.';
  end if;

  if nullif(trim(location_city), '') is null then
    raise exception 'Clinic location city is required.';
  end if;

  insert into public.clinics (name, email, phone)
  values (
    trim(clinic_name),
    nullif(trim(clinic_email), ''),
    nullif(trim(clinic_phone), '')
  )
  returning id into created_clinic_id;

  insert into public.clinic_locations (
    clinic_id,
    address,
    city
  )
  values (
    created_clinic_id,
    trim(location_address),
    trim(location_city)
  );

  insert into public.clinic_admin_memberships (
    user_id,
    clinic_id,
    role,
    status
  )
  values (
    auth.uid(),
    created_clinic_id,
    'owner',
    'active'
  );

  return created_clinic_id;
end;
$$;
