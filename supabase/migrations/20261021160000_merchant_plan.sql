-- The plan a merchant picked on the pricing page, carried through
-- /signup?plan=…&interval=…. Recorded for the owner console only: there is
-- no billing yet, so nothing enforces plan limits.
alter table public.merchants
  add column if not exists plan text
    check (plan is null or plan in ('starter', 'growth', 'pro')),
  add column if not exists plan_interval text
    check (plan_interval is null or plan_interval in ('monthly', 'annual'));

-- Written only by the server with the service role. Merchants already have
-- column-level update grants that don't include these; revoke to be explicit.
revoke update (plan, plan_interval) on public.merchants from anon, authenticated;
