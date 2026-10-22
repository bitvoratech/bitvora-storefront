-- Merchants pay for their plan through Paystack (card, renewing monthly or
-- annually). These columns track that subscription; the Paystack webhook and
-- the payment callback write them with the service role.
alter table public.merchants
  add column if not exists subscription_status text
    check (subscription_status is null or subscription_status in ('active', 'non_renewing', 'past_due', 'cancelled', 'comped')),
  add column if not exists current_period_end timestamptz,
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_subscription_code text,
  add column if not exists paystack_email_token text,
  add column if not exists last_payment_reference text;

create unique index if not exists merchants_paystack_customer_code_idx
  on public.merchants (paystack_customer_code) where paystack_customer_code is not null;
create index if not exists merchants_paystack_subscription_code_idx
  on public.merchants (paystack_subscription_code) where paystack_subscription_code is not null;

-- Merchants must never mark their own plan as paid.
revoke update (subscription_status, current_period_end, paystack_customer_code,
  paystack_subscription_code, paystack_email_token, last_payment_reference)
  on public.merchants from anon, authenticated;

-- Mirrors hasActivePlan() in apps/admin/src/lib/plans.ts, including the
-- 3-day grace for a renewal Paystack is still retrying.
create or replace function public.merchant_has_active_plan(m public.merchants)
returns boolean
language sql
stable
set search_path = public
as $$
  select m.subscription_status = 'comped'
    or (m.subscription_status in ('active', 'non_renewing', 'past_due')
        and m.current_period_end + interval '3 days' > now());
$$;

-- A store now also needs a paid plan.
create or replace function public.current_merchant_can_create_store()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from merchants m
    where m.user_id = auth.uid()
      and m.is_suspended = false
      and m.verification_status = 'verified'
      and m.is_owner = false
      and m.is_admin = false
      and public.merchant_has_active_plan(m)
  );
$$;
