-- Merchants can upgrade their plan mid-period by bank transfer, paying only
-- the difference for the days left. An upgrade transfer switches the plan on
-- confirm and leaves the paid-until date alone; a 'plan' transfer pays for a
-- new period as before.
alter table public.plan_transfers
  add column if not exists kind text not null default 'plan'
    check (kind in ('plan', 'upgrade'));
