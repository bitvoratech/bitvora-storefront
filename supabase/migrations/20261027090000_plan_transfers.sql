-- Merchants can pay for their plan by bank transfer while Paystack card
-- payments aren't available. Each row is a merchant saying "I've sent it";
-- staff check the bank account and confirm or reject it in the owner console.
-- Only the server (service role) reads and writes this table.
create table if not exists public.plan_transfers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  plan text not null check (plan in ('starter', 'growth', 'pro')),
  plan_interval text not null check (plan_interval in ('monthly', 'annual')),
  -- ₦ the merchant was asked to send, after any discount.
  amount integer not null check (amount > 0),
  reference text not null,
  sender_name text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.merchants(id) on delete set null,
  created_at timestamptz not null default now()
);

-- One transfer waiting for review per merchant.
create unique index if not exists plan_transfers_one_pending_idx
  on public.plan_transfers (merchant_id) where status = 'pending';
create index if not exists plan_transfers_merchant_idx
  on public.plan_transfers (merchant_id, created_at desc);

-- RLS on with no policies: merchants and the public can't touch it directly.
alter table public.plan_transfers enable row level security;
revoke all on public.plan_transfers from anon, authenticated;
