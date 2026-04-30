alter type public.payment_type add value if not exists 'deposit';
alter type public.payment_type add value if not exists 'cancellation_fee';
alter type public.payment_type add value if not exists 'platform_fee';

alter type public.payment_provider add value if not exists 'paytrail';

alter table public.payments
  add column if not exists provider_checkout_id text,
  add column if not exists provider_refund_id text,
  add column if not exists platform_fee_amount numeric(10, 2) not null default 0,
  add column if not exists provider_fee_amount numeric(10, 2) not null default 0,
  add column if not exists payout_amount numeric(10, 2) not null default 0,
  add column if not exists payout_provider_id text,
  add column if not exists refund_reason text,
  add column if not exists cancellation_policy_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists paid_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.payments
  drop constraint if exists payments_future_amounts_check;

alter table public.payments
  add constraint payments_future_amounts_check
  check (
    platform_fee_amount >= 0
    and provider_fee_amount >= 0
    and payout_amount >= 0
    and platform_fee_amount + provider_fee_amount <= amount
    and payout_amount <= amount
  );

alter table public.payments
  drop constraint if exists payments_appointment_type_scope_check;

alter table public.payments
  add constraint payments_appointment_type_scope_check
  check (
    payment_type::text not in ('appointment', 'deposit', 'cancellation_fee')
    or appointment_id is not null
  );

create index if not exists payments_type_status_idx
on public.payments (payment_type, status);

create index if not exists payments_paid_at_idx
on public.payments (paid_at desc)
where paid_at is not null;

create unique index if not exists payments_provider_checkout_unique_idx
on public.payments (provider, provider_checkout_id)
where provider_checkout_id is not null;

create unique index if not exists payments_provider_refund_unique_idx
on public.payments (provider, provider_refund_id)
where provider_refund_id is not null;

comment on table public.payments is
'Stores subscription payment records and future appointment, deposit, cancellation-fee, and platform-fee payment records. Card details must remain with the payment provider and must not be stored in MediMeet.';

comment on column public.payments.platform_fee_amount is
'Future appointment-payment commission retained by the platform.';

comment on column public.payments.provider_fee_amount is
'Future provider processing fee recorded from Stripe, Paytrail, or another payment provider.';

comment on column public.payments.payout_amount is
'Future net amount expected to be paid out to the doctor or clinic after platform and provider fees.';

comment on column public.payments.cancellation_policy_snapshot is
'Future immutable cancellation or refund policy context captured at payment time.';
