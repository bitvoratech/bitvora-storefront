-- Signup is now: basic details → phone OTP → pay for the plan → NIN/CAC
-- compliance, which merchants can skip for a while.
--   1. A verified phone (not an approved NIN/CAC) is what unlocks creating a
--      store. Approval only earns the Verified seller badge.
--   2. Skipping has a deadline: 30 days after signup, a merchant who hasn't
--      sent NIN/CAC (or whose details were rejected) has their stores taken
--      off the public storefront until they send them. They can still log in
--      and finish compliance from the dashboard.
--   3. Plan limits are enforced here too, not just in the app: stores per
--      merchant and products per store.

-- ============================================
-- 1. COMPLIANCE DEADLINE
-- ============================================
-- The volatile default gives every existing merchant 30 days from today too,
-- so nobody's store goes dark the moment this runs.
alter table public.merchants
  add column if not exists compliance_due_at timestamptz default (now() + interval '30 days');

-- Merchants must not push their own deadline back. (Table-level UPDATE was
-- revoked in security_hardening; this is a no-op unless that changes.)
revoke update (compliance_due_at) on public.merchants from anon, authenticated;

-- Mirrors complianceOverdue() in apps/admin/src/lib/merchant-identity.ts.
-- 'pending' isn't overdue: the merchant has done their part and is waiting on us.
create or replace function public.merchant_compliance_overdue(m public.merchants)
returns boolean
language sql
stable
set search_path = public
as $$
  select m.verification_status in ('unverified', 'failed')
    and m.compliance_due_at is not null
    and m.compliance_due_at <= now();
$$;

-- Public storefront visibility (stores, products, checkout) goes through this.
create or replace function public.is_merchant_active(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from merchants m
    where m.id = p_merchant_id
      and m.is_suspended = false
      and not public.merchant_compliance_overdue(m)
  );
$$;


-- ============================================
-- 2 + 3. STORE CREATION: verified phone, paid plan, under the store limit
-- ============================================
-- Mirrors PLAN_STORE_LIMIT / PLAN_PRODUCT_LIMIT in apps/admin/src/lib/plans.ts.
-- null means unlimited.
create or replace function public.plan_store_limit(p_plan text)
returns integer
language sql
immutable
as $$
  select case p_plan when 'starter' then 1 when 'growth' then 2 when 'pro' then 5 end;
$$;

create or replace function public.plan_product_limit(p_plan text)
returns integer
language sql
immutable
as $$
  select case p_plan when 'starter' then 30 when 'growth' then 150 end;
$$;

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
      and (m.phone_verified_at is not null or m.verification_status = 'verified')
      and m.is_owner = false
      and m.is_admin = false
      and public.merchant_has_active_plan(m)
      and (
        public.plan_store_limit(m.plan) is null
        or (select count(*) from stores s where s.merchant_id = m.id) < public.plan_store_limit(m.plan)
      )
  );
$$;

-- Products per store. A trigger rather than a policy so the service role is
-- held to it too, and so the error says what went wrong.
create or replace function public.enforce_plan_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  select public.plan_product_limit(m.plan) into v_limit
  from stores s join merchants m on m.id = s.merchant_id
  where s.id = new.store_id;

  if v_limit is null then
    return new;
  end if;

  -- Serialise inserts into the same store so two at once can't both squeeze
  -- under the limit.
  perform pg_advisory_xact_lock(hashtext('plan_product_limit:' || new.store_id::text));
  select count(*) into v_count from products where store_id = new.store_id;
  if v_count >= v_limit then
    raise exception 'plan_product_limit: this plan allows % products per store', v_limit
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_plan_product_limit on public.products;
create trigger enforce_plan_product_limit
  before insert on public.products
  for each row execute function public.enforce_plan_product_limit();

revoke execute on function public.current_merchant_can_create_store() from public;
grant execute on function public.current_merchant_can_create_store() to authenticated, service_role;
revoke execute on function public.is_merchant_active(uuid) from public;
grant execute on function public.is_merchant_active(uuid) to anon, authenticated, service_role;
