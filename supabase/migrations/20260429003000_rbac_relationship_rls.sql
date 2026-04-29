do $$
begin
  create type public.report_status as enum (
    'open',
    'under_review',
    'resolved',
    'dismissed'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.clinic_admin_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  role public.membership_role not null default 'admin',
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_admin_memberships_unique unique (user_id, clinic_id),
  constraint clinic_admin_memberships_admin_role_check
    check (role in ('owner', 'admin'))
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  reason text not null,
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reports_no_self_report_check
    check (reporter_user_id <> reported_user_id),
  constraint user_reports_review_check
    check (
      (reviewed_by is null and reviewed_at is null)
      or (reviewed_by is not null and reviewed_at is not null)
    )
);

drop trigger if exists clinic_admin_memberships_touch_updated_at
on public.clinic_admin_memberships;
create trigger clinic_admin_memberships_touch_updated_at
before update on public.clinic_admin_memberships
for each row execute function public.touch_updated_at();

drop trigger if exists user_reports_touch_updated_at on public.user_reports;
create trigger user_reports_touch_updated_at
before update on public.user_reports
for each row execute function public.touch_updated_at();

create index if not exists clinic_admin_memberships_user_id_idx
on public.clinic_admin_memberships (user_id);

create index if not exists clinic_admin_memberships_clinic_id_idx
on public.clinic_admin_memberships (clinic_id);

create index if not exists clinic_admin_memberships_status_idx
on public.clinic_admin_memberships (status);

create index if not exists user_reports_reporter_user_id_idx
on public.user_reports (reporter_user_id);

create index if not exists user_reports_reported_user_id_idx
on public.user_reports (reported_user_id);

create index if not exists user_reports_status_idx
on public.user_reports (status);

create index if not exists user_reports_appointment_id_idx
on public.user_reports (appointment_id);

create or replace function public.get_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select public.get_user_role()
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_user_role() = 'platform_admin', false)
$$;

create or replace function public.is_profile_owner(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.uid() = target_user_id, false)
$$;

create or replace function public.is_patient_profile_owner(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_profiles pp
    where pp.id = target_patient_id
      and pp.user_id = auth.uid()
  )
$$;

create or replace function public.is_doctor_profile_owner(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_profiles dp
    where dp.id = target_doctor_id
      and dp.user_id = auth.uid()
  )
$$;

create or replace function public.is_public_verified_doctor(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_profiles dp
    where dp.id = target_doctor_id
      and dp.is_public = true
      and dp.verification_status = 'approved'
  )
$$;

create or replace function public.is_public_doctor(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_public_verified_doctor(target_doctor_id)
$$;

create or replace function public.is_clinic_admin(target_clinic_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_user_role() = 'clinic_admin', false)
    and exists (
      select 1
      from public.clinic_admin_memberships cam
      where cam.user_id = auth.uid()
        and cam.status = 'active'
        and cam.role in ('owner', 'admin')
        and (
          target_clinic_id is null
          or cam.clinic_id = target_clinic_id
        )
    )
$$;

create or replace function public.is_doctor_for_appointment(
  target_appointment_id uuid
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
    where a.id = target_appointment_id
      and dp.user_id = auth.uid()
  )
$$;

create or replace function public.is_patient_for_appointment(
  target_appointment_id uuid
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
    join public.patient_profiles pp on pp.id = a.patient_id
    where a.id = target_appointment_id
      and pp.user_id = auth.uid()
  )
$$;

create or replace function public.has_doctor_patient_relationship(
  target_doctor_id uuid,
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
    from public.doctor_patient_relationships dpr
    where dpr.doctor_id = target_doctor_id
      and dpr.patient_id = target_patient_id
      and dpr.relationship_status = 'active'
  )
$$;

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
      and a.status in ('pending', 'confirmed', 'completed')
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

create or replace function public.is_clinic_admin_for_doctor(
  target_doctor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_clinic_memberships dcm
    where dcm.doctor_id = target_doctor_id
      and dcm.status = 'active'
      and public.is_clinic_admin(dcm.clinic_id)
  )
$$;

create or replace function public.is_clinic_admin_for_doctor_location(
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
    left join public.clinic_locations cl on cl.id = dl.clinic_location_id
    where dl.id = target_location_id
      and (
        public.is_clinic_admin_for_doctor(dl.doctor_id)
        or (cl.clinic_id is not null and public.is_clinic_admin(cl.clinic_id))
      )
  )
$$;

create or replace function public.is_clinic_admin_for_appointment(
  target_appointment_id uuid
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
    where a.id = target_appointment_id
      and (
        (a.clinic_id is not null and public.is_clinic_admin(a.clinic_id))
        or public.is_clinic_admin_for_doctor(a.doctor_id)
        or public.is_clinic_admin_for_doctor_location(a.location_id)
      )
  )
$$;

create or replace function public.is_clinic_admin_for_patient(
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
    where a.patient_id = target_patient_id
      and public.is_clinic_admin_for_appointment(a.id)
  )
$$;

create or replace function public.can_read_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_profile_owner(target_user_id)
    or public.is_platform_admin()
    or exists (
      select 1
      from public.patient_profiles pp
      where pp.user_id = target_user_id
        and (
          public.is_current_doctor_for_patient(pp.id)
          or public.is_clinic_admin_for_patient(pp.id)
        )
    )
    or exists (
      select 1
      from public.doctor_profiles dp
      where dp.user_id = target_user_id
        and (
          public.is_doctor_profile_owner(dp.id)
          or public.is_clinic_admin_for_doctor(dp.id)
        )
    )
$$;

create or replace function public.can_review_appointment(
  target_appointment_id uuid,
  target_patient_id uuid,
  target_doctor_id uuid
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
    where a.id = target_appointment_id
      and a.patient_id = target_patient_id
      and a.doctor_id = target_doctor_id
      and a.status = 'completed'
  )
$$;

create or replace function public.is_bookable_slot(
  target_slot_id uuid,
  target_doctor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointment_slots s
    where s.id = target_slot_id
      and s.doctor_id = target_doctor_id
      and s.status = 'available'
      and s.start_time > now()
  )
$$;

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

  if new.verification_status is distinct from old.verification_status then
    raise exception 'Only platform admins can change doctor verification status.';
  end if;

  if new.average_rating is distinct from old.average_rating then
    raise exception 'Only platform admins or trusted backend jobs can change doctor average rating.';
  end if;

  return new;
end;
$$;

drop trigger if exists doctor_profiles_enforce_update_security
on public.doctor_profiles;
create trigger doctor_profiles_enforce_update_security
before update on public.doctor_profiles
for each row execute function public.enforce_doctor_profile_update_security();

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
    if old.status not in ('pending', 'confirmed') then
      raise exception 'Only pending or confirmed appointments can be cancelled by patients.';
    end if;

    if new.status <> 'cancelled' then
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

drop trigger if exists appointments_enforce_update_security
on public.appointments;
create trigger appointments_enforce_update_security
before update on public.appointments
for each row execute function public.enforce_appointment_update_security();

create or replace function public.audit_sensitive_admin_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  audit_metadata jsonb;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'INSERT' then
    target_id := new.id;
    audit_metadata := jsonb_build_object('new_row', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    target_id := new.id;
    audit_metadata := jsonb_build_object(
      'old_row',
      to_jsonb(old),
      'new_row',
      to_jsonb(new)
    );
  else
    target_id := old.id;
    audit_metadata := jsonb_build_object('old_row', to_jsonb(old));
  end if;

  insert into public.audit_logs (
    actor_user_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    target_id,
    audit_metadata
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_audit_sensitive_admin_action on public.profiles;
create trigger profiles_audit_sensitive_admin_action
after insert or update or delete on public.profiles
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists doctor_profiles_audit_sensitive_admin_action
on public.doctor_profiles;
create trigger doctor_profiles_audit_sensitive_admin_action
after insert or update or delete on public.doctor_profiles
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists doctor_verification_documents_audit_sensitive_admin_action
on public.doctor_verification_documents;
create trigger doctor_verification_documents_audit_sensitive_admin_action
after insert or update or delete on public.doctor_verification_documents
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists clinics_audit_sensitive_admin_action on public.clinics;
create trigger clinics_audit_sensitive_admin_action
after insert or update or delete on public.clinics
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists clinic_admin_memberships_audit_sensitive_admin_action
on public.clinic_admin_memberships;
create trigger clinic_admin_memberships_audit_sensitive_admin_action
after insert or update or delete on public.clinic_admin_memberships
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists doctor_clinic_memberships_audit_sensitive_admin_action
on public.doctor_clinic_memberships;
create trigger doctor_clinic_memberships_audit_sensitive_admin_action
after insert or update or delete on public.doctor_clinic_memberships
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists subscriptions_audit_sensitive_admin_action
on public.subscriptions;
create trigger subscriptions_audit_sensitive_admin_action
after insert or update or delete on public.subscriptions
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists payments_audit_sensitive_admin_action
on public.payments;
create trigger payments_audit_sensitive_admin_action
after insert or update or delete on public.payments
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists invoices_audit_sensitive_admin_action
on public.invoices;
create trigger invoices_audit_sensitive_admin_action
after insert or update or delete on public.invoices
for each row execute function public.audit_sensitive_admin_action();

drop trigger if exists user_reports_audit_sensitive_admin_action
on public.user_reports;
create trigger user_reports_audit_sensitive_admin_action
after insert or update or delete on public.user_reports
for each row execute function public.audit_sensitive_admin_action();

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'profiles',
        'patient_profiles',
        'doctor_profiles',
        'doctor_verification_documents',
        'clinics',
        'clinic_locations',
        'clinic_admin_memberships',
        'doctor_clinic_memberships',
        'doctor_locations',
        'doctor_availability',
        'appointment_slots',
        'appointments',
        'doctor_patient_relationships',
        'reviews',
        'subscriptions',
        'payments',
        'invoices',
        'notifications',
        'audit_logs',
        'user_reports'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.doctor_verification_documents enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_locations enable row level security;
alter table public.clinic_admin_memberships enable row level security;
alter table public.doctor_clinic_memberships enable row level security;
alter table public.doctor_locations enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_patient_relationships enable row level security;
alter table public.reviews enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_reports enable row level security;

create policy "profiles_select_relationship_scoped"
on public.profiles
for select
to authenticated
using (public.can_read_profile(id));

create policy "profiles_update_own_or_platform"
on public.profiles
for update
to authenticated
using (public.is_profile_owner(id) or public.is_platform_admin())
with check (public.is_profile_owner(id) or public.is_platform_admin());

create policy "profiles_delete_platform_admin"
on public.profiles
for delete
to authenticated
using (public.is_platform_admin());

create policy "patient_profiles_select_owner_care_team_or_admin"
on public.patient_profiles
for select
to authenticated
using (
  public.is_patient_profile_owner(id)
  or public.is_current_doctor_for_patient(id)
  or public.is_clinic_admin_for_patient(id)
  or public.is_platform_admin()
);

create policy "patient_profiles_insert_own_or_platform"
on public.patient_profiles
for insert
to authenticated
with check (
  public.is_profile_owner(user_id)
  or public.is_platform_admin()
);

create policy "patient_profiles_update_own_or_platform"
on public.patient_profiles
for update
to authenticated
using (
  public.is_patient_profile_owner(id)
  or public.is_platform_admin()
)
with check (
  public.is_profile_owner(user_id)
  or public.is_platform_admin()
);

create policy "patient_profiles_delete_platform_admin"
on public.patient_profiles
for delete
to authenticated
using (public.is_platform_admin());

create policy "doctor_profiles_select_public_verified"
on public.doctor_profiles
for select
to anon, authenticated
using (public.is_public_verified_doctor(id));

create policy "doctor_profiles_select_owner_clinic_or_admin"
on public.doctor_profiles
for select
to authenticated
using (
  public.is_doctor_profile_owner(id)
  or public.is_clinic_admin_for_doctor(id)
  or public.is_platform_admin()
);

create policy "doctor_profiles_insert_own_doctor_or_platform"
on public.doctor_profiles
for insert
to authenticated
with check (
  (
    public.is_profile_owner(user_id)
    and public.get_user_role() = 'doctor'
  )
  or public.is_platform_admin()
);

create policy "doctor_profiles_update_owner_clinic_or_platform"
on public.doctor_profiles
for update
to authenticated
using (
  public.is_doctor_profile_owner(id)
  or public.is_clinic_admin_for_doctor(id)
  or public.is_platform_admin()
)
with check (
  public.is_profile_owner(user_id)
  or public.is_clinic_admin_for_doctor(id)
  or public.is_platform_admin()
);

create policy "doctor_profiles_delete_platform_admin"
on public.doctor_profiles
for delete
to authenticated
using (public.is_platform_admin());

create policy "doctor_verification_documents_select_owner_or_platform"
on public.doctor_verification_documents
for select
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_verification_documents_insert_owner_or_platform"
on public.doctor_verification_documents
for insert
to authenticated
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_verification_documents_update_platform_admin"
on public.doctor_verification_documents
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "doctor_verification_documents_delete_platform_admin"
on public.doctor_verification_documents
for delete
to authenticated
using (public.is_platform_admin());

create policy "clinics_select_related_authenticated_users"
on public.clinics
for select
to authenticated
using (
  public.is_clinic_admin(id)
  or public.is_platform_admin()
  or exists (
    select 1
    from public.doctor_clinic_memberships dcm
    join public.doctor_profiles dp on dp.id = dcm.doctor_id
    where dcm.clinic_id = clinics.id
      and dcm.status = 'active'
      and dp.user_id = auth.uid()
  )
);

create policy "clinics_insert_platform_admin"
on public.clinics
for insert
to authenticated
with check (public.is_platform_admin());

create policy "clinics_update_clinic_or_platform_admin"
on public.clinics
for update
to authenticated
using (
  public.is_clinic_admin(id)
  or public.is_platform_admin()
)
with check (
  public.is_clinic_admin(id)
  or public.is_platform_admin()
);

create policy "clinics_delete_platform_admin"
on public.clinics
for delete
to authenticated
using (public.is_platform_admin());

create policy "clinic_locations_select_related_authenticated_users"
on public.clinic_locations
for select
to authenticated
using (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
  or exists (
    select 1
    from public.doctor_clinic_memberships dcm
    join public.doctor_profiles dp on dp.id = dcm.doctor_id
    where dcm.clinic_id = clinic_locations.clinic_id
      and dcm.status = 'active'
      and dp.user_id = auth.uid()
  )
);

create policy "clinic_locations_insert_clinic_or_platform_admin"
on public.clinic_locations
for insert
to authenticated
with check (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "clinic_locations_update_clinic_or_platform_admin"
on public.clinic_locations
for update
to authenticated
using (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
)
with check (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "clinic_locations_delete_clinic_or_platform_admin"
on public.clinic_locations
for delete
to authenticated
using (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "clinic_admin_memberships_select_self_clinic_or_platform"
on public.clinic_admin_memberships
for select
to authenticated
using (
  public.is_profile_owner(user_id)
  or public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "clinic_admin_memberships_manage_platform_admin"
on public.clinic_admin_memberships
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "doctor_clinic_memberships_select_doctor_clinic_or_platform"
on public.doctor_clinic_memberships
for select
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "doctor_clinic_memberships_insert_clinic_or_platform_admin"
on public.doctor_clinic_memberships
for insert
to authenticated
with check (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "doctor_clinic_memberships_update_clinic_or_platform_admin"
on public.doctor_clinic_memberships
for update
to authenticated
using (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
)
with check (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "doctor_clinic_memberships_delete_clinic_or_platform_admin"
on public.doctor_clinic_memberships
for delete
to authenticated
using (
  public.is_clinic_admin(clinic_id)
  or public.is_platform_admin()
);

create policy "doctor_locations_select_public_patient_owner_clinic_or_admin"
on public.doctor_locations
for select
to authenticated
using (
  (is_active = true and public.is_public_verified_doctor(doctor_id))
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor_location(id)
  or public.is_platform_admin()
);

create policy "doctor_locations_insert_owner_clinic_or_platform"
on public.doctor_locations
for insert
to authenticated
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_locations_update_owner_clinic_or_platform"
on public.doctor_locations
for update
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor_location(id)
  or public.is_platform_admin()
)
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_locations_delete_owner_clinic_or_platform"
on public.doctor_locations
for delete
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor_location(id)
  or public.is_platform_admin()
);

create policy "doctor_availability_select_patient_owner_clinic_or_admin"
on public.doctor_availability
for select
to authenticated
using (
  (is_active = true and public.is_public_verified_doctor(doctor_id))
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_availability_insert_owner_clinic_or_platform"
on public.doctor_availability
for insert
to authenticated
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_availability_update_owner_clinic_or_platform"
on public.doctor_availability
for update
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
)
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_availability_delete_owner_clinic_or_platform"
on public.doctor_availability
for delete
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "appointment_slots_select_available_or_related"
on public.appointment_slots
for select
to authenticated
using (
  (status = 'available' and public.is_public_verified_doctor(doctor_id))
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "appointment_slots_insert_owner_clinic_or_platform"
on public.appointment_slots
for insert
to authenticated
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "appointment_slots_update_owner_clinic_or_platform"
on public.appointment_slots
for update
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
)
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "appointment_slots_delete_owner_clinic_or_platform"
on public.appointment_slots
for delete
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "appointments_select_participant_clinic_or_platform"
on public.appointments
for select
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_appointment(id)
  or public.is_platform_admin()
);

create policy "appointments_insert_patient_clinic_or_platform"
on public.appointments
for insert
to authenticated
with check (
  (
    public.is_patient_profile_owner(patient_id)
    and public.is_public_verified_doctor(doctor_id)
    and public.is_bookable_slot(slot_id, doctor_id)
  )
  or public.is_clinic_admin_for_doctor(doctor_id)
  or (clinic_id is not null and public.is_clinic_admin(clinic_id))
  or public.is_platform_admin()
);

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
    and status = 'cancelled'
    and cancelled_by = auth.uid()
  )
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or (clinic_id is not null and public.is_clinic_admin(clinic_id))
  or public.is_platform_admin()
);

create policy "appointments_delete_platform_admin"
on public.appointments
for delete
to authenticated
using (public.is_platform_admin());

create policy "doctor_patient_relationships_select_participant_clinic_or_admin"
on public.doctor_patient_relationships
for select
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_patient_relationships_insert_doctor_clinic_or_platform"
on public.doctor_patient_relationships
for insert
to authenticated
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_patient_relationships_update_doctor_clinic_or_platform"
on public.doctor_patient_relationships
for update
to authenticated
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
)
with check (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_clinic_admin_for_doctor(doctor_id)
  or public.is_platform_admin()
);

create policy "doctor_patient_relationships_delete_platform_admin"
on public.doctor_patient_relationships
for delete
to authenticated
using (public.is_platform_admin());

create policy "reviews_select_authenticated_public_or_participant"
on public.reviews
for select
to authenticated
using (
  is_public = true
  or public.is_patient_profile_owner(patient_id)
  or public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

create policy "reviews_insert_patient_for_completed_appointment"
on public.reviews
for insert
to authenticated
with check (
  public.is_patient_profile_owner(patient_id)
  and public.can_review_appointment(appointment_id, patient_id, doctor_id)
);

create policy "reviews_update_patient_or_platform"
on public.reviews
for update
to authenticated
using (
  public.is_patient_profile_owner(patient_id)
  or public.is_platform_admin()
)
with check (
  public.is_patient_profile_owner(patient_id)
  or public.is_platform_admin()
);

create policy "reviews_delete_platform_admin"
on public.reviews
for delete
to authenticated
using (public.is_platform_admin());

create policy "subscriptions_select_owner_clinic_or_platform"
on public.subscriptions
for select
to authenticated
using (
  (doctor_id is not null and public.is_doctor_profile_owner(doctor_id))
  or (clinic_id is not null and public.is_clinic_admin(clinic_id))
  or public.is_platform_admin()
);

create policy "subscriptions_manage_platform_admin"
on public.subscriptions
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "payments_select_related_users"
on public.payments
for select
to authenticated
using (
  public.is_profile_owner(payer_user_id)
  or (doctor_id is not null and public.is_doctor_profile_owner(doctor_id))
  or (clinic_id is not null and public.is_clinic_admin(clinic_id))
  or (
    appointment_id is not null
    and (
      public.is_patient_for_appointment(appointment_id)
      or public.is_doctor_for_appointment(appointment_id)
      or public.is_clinic_admin_for_appointment(appointment_id)
    )
  )
  or public.is_platform_admin()
);

create policy "payments_manage_platform_admin"
on public.payments
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "invoices_select_owner_clinic_or_platform"
on public.invoices
for select
to authenticated
using (
  (doctor_id is not null and public.is_doctor_profile_owner(doctor_id))
  or (clinic_id is not null and public.is_clinic_admin(clinic_id))
  or public.is_platform_admin()
);

create policy "invoices_manage_platform_admin"
on public.invoices
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "notifications_select_own_or_platform"
on public.notifications
for select
to authenticated
using (
  public.is_profile_owner(user_id)
  or public.is_platform_admin()
);

create policy "notifications_update_own_or_platform"
on public.notifications
for update
to authenticated
using (
  public.is_profile_owner(user_id)
  or public.is_platform_admin()
)
with check (
  public.is_profile_owner(user_id)
  or public.is_platform_admin()
);

create policy "notifications_insert_platform_admin"
on public.notifications
for insert
to authenticated
with check (public.is_platform_admin());

create policy "notifications_delete_platform_admin"
on public.notifications
for delete
to authenticated
using (public.is_platform_admin());

create policy "audit_logs_select_platform_admin"
on public.audit_logs
for select
to authenticated
using (public.is_platform_admin());

create policy "audit_logs_insert_platform_admin"
on public.audit_logs
for insert
to authenticated
with check (
  public.is_platform_admin()
  and actor_user_id = auth.uid()
);

create policy "user_reports_select_reporter_or_platform"
on public.user_reports
for select
to authenticated
using (
  public.is_profile_owner(reporter_user_id)
  or public.is_platform_admin()
);

create policy "user_reports_insert_authenticated_reporter"
on public.user_reports
for insert
to authenticated
with check (
  public.is_profile_owner(reporter_user_id)
  and reporter_user_id <> reported_user_id
);

create policy "user_reports_update_platform_admin"
on public.user_reports
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "user_reports_delete_platform_admin"
on public.user_reports
for delete
to authenticated
using (public.is_platform_admin());
