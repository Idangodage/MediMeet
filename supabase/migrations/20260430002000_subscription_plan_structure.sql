create or replace function public.normalize_subscription_plan_name(
  target_plan_name text
)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when lower(trim(coalesce(target_plan_name, ''))) in ('basic', 'basic plan')
      then 'basic'
    when lower(trim(coalesce(target_plan_name, ''))) in ('pro', 'pro plan')
      then 'pro'
    when lower(trim(coalesce(target_plan_name, ''))) in ('clinic', 'clinic plan')
      then 'clinic'
    else 'free'
  end
$$;

create or replace function public.is_subscription_effective(
  target_status public.subscription_status,
  target_current_period_end timestamptz
)
returns boolean
language sql
stable
set search_path = public
as $$
  select target_status in ('trialing', 'active')
    and (
      target_current_period_end is null
      or target_current_period_end >= now()
    )
$$;

create index if not exists subscriptions_doctor_period_idx
on public.subscriptions (doctor_id, current_period_end desc nulls last);

create index if not exists subscriptions_clinic_period_idx
on public.subscriptions (clinic_id, current_period_end desc nulls last);
