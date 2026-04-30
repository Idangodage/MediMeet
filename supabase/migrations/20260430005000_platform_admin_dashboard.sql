alter type public.verification_status add value if not exists 'suspended';

alter table public.user_reports
add column if not exists admin_note text;

create index if not exists user_reports_created_at_idx
on public.user_reports (created_at desc);

create index if not exists audit_logs_created_at_idx
on public.audit_logs (created_at desc);

create or replace function public.admin_moderate_doctor_profile(
  target_doctor_id uuid,
  target_verification_status public.verification_status default null,
  target_is_public boolean default null,
  moderation_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row public.doctor_profiles%rowtype;
  after_row public.doctor_profiles%rowtype;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception 'Only platform admins can moderate doctor profiles.';
  end if;

  select *
  into before_row
  from public.doctor_profiles
  where id = target_doctor_id
  for update;

  if not found then
    raise exception 'Doctor profile not found.';
  end if;

  update public.doctor_profiles
  set
    verification_status = coalesce(target_verification_status, verification_status),
    is_public = coalesce(target_is_public, is_public)
  where id = target_doctor_id
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
    'doctor_profile_moderation',
    'doctor_profiles',
    target_doctor_id,
    jsonb_build_object(
      'note', nullif(trim(coalesce(moderation_note, '')), ''),
      'old_row', to_jsonb(before_row),
      'new_row', to_jsonb(after_row)
    )
  );
end;
$$;

create or replace function public.admin_review_user_report(
  target_report_id uuid,
  target_status public.report_status,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row public.user_reports%rowtype;
  after_row public.user_reports%rowtype;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception 'Only platform admins can review reported profiles.';
  end if;

  select *
  into before_row
  from public.user_reports
  where id = target_report_id
  for update;

  if not found then
    raise exception 'Report not found.';
  end if;

  update public.user_reports
  set
    status = target_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_note = nullif(trim(coalesce(review_note, '')), '')
  where id = target_report_id
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
    'user_report_review',
    'user_reports',
    target_report_id,
    jsonb_build_object(
      'note', nullif(trim(coalesce(review_note, '')), ''),
      'old_row', to_jsonb(before_row),
      'new_row', to_jsonb(after_row)
    )
  );
end;
$$;

grant execute on function public.admin_moderate_doctor_profile(
  uuid,
  public.verification_status,
  boolean,
  text
) to authenticated;

grant execute on function public.admin_review_user_report(
  uuid,
  public.report_status,
  text
) to authenticated;
