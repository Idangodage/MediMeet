alter table public.doctor_profiles
  add column if not exists services text[] not null default '{}';

create index if not exists doctor_profiles_services_idx
on public.doctor_profiles using gin (services);
