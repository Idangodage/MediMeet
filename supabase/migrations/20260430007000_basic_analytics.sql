create table if not exists public.doctor_profile_views (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  viewer_user_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index if not exists doctor_profile_views_doctor_viewed_at_idx
on public.doctor_profile_views (doctor_id, viewed_at desc);

create index if not exists doctor_profile_views_viewer_viewed_at_idx
on public.doctor_profile_views (viewer_user_id, viewed_at desc)
where viewer_user_id is not null;

alter table public.doctor_profile_views enable row level security;

drop policy if exists "doctor_profile_views_select_owner_or_platform_admin"
on public.doctor_profile_views;
create policy "doctor_profile_views_select_owner_or_platform_admin"
on public.doctor_profile_views
for select
using (
  public.is_doctor_profile_owner(doctor_id)
  or public.is_platform_admin()
);

drop policy if exists "doctor_profile_views_insert_public_verified"
on public.doctor_profile_views;
create policy "doctor_profile_views_insert_public_verified"
on public.doctor_profile_views
for insert
with check (
  public.is_public_verified_doctor(doctor_id)
  and (
    viewer_user_id is null
    or viewer_user_id = auth.uid()
  )
);

create or replace function public.record_doctor_profile_view(
  target_doctor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_view_id uuid;
begin
  if not public.is_public_verified_doctor(target_doctor_id) then
    raise exception 'Doctor profile is not public.';
  end if;

  insert into public.doctor_profile_views (
    doctor_id,
    viewer_user_id
  )
  values (
    target_doctor_id,
    auth.uid()
  )
  returning id into created_view_id;

  return created_view_id;
end;
$$;

revoke execute on function public.record_doctor_profile_view(uuid)
from public;

grant execute on function public.record_doctor_profile_view(uuid)
to anon, authenticated;
