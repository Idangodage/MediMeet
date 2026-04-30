alter type public.subscription_status add value if not exists 'suspended';

alter table public.invoices
  add column if not exists provider_invoice_id text,
  add column if not exists provider_payment_id text,
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz;

create unique index if not exists invoices_provider_invoice_id_unique_idx
on public.invoices (provider_invoice_id)
where provider_invoice_id is not null;

create index if not exists invoices_provider_payment_id_idx
on public.invoices (provider_payment_id)
where provider_payment_id is not null;

create index if not exists subscriptions_status_period_idx
on public.subscriptions (status, current_period_end desc nulls last);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  constraint stripe_webhook_events_payload_check
    check (jsonb_typeof(payload) = 'object')
);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "stripe_webhook_events_select_platform_admin"
on public.stripe_webhook_events;
create policy "stripe_webhook_events_select_platform_admin"
on public.stripe_webhook_events
for select
to authenticated
using (public.is_platform_admin());
