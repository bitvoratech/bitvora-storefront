-- ============================================
-- PLATFORM ADMINS
-- The owner can now add admins from the owner console. Admins help run the
-- platform (merchants, verifications, stores, orders) but can't manage other
-- admins; only the owner can. Neither the owner nor admins run stores.
-- ============================================

alter table merchants add column if not exists is_admin boolean not null default false;

-- Written only by the server (service role) after an owner check. The
-- column-scoped UPDATE grant from security_hardening doesn't include it; this
-- keeps it that way explicitly.
revoke update (is_admin) on public.merchants from anon, authenticated;

-- Staff accounts are for running the platform, not for selling.
create or replace function public.current_merchant_can_create_store()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from merchants
    where user_id = auth.uid()
      and is_suspended = false
      and verification_status = 'verified'
      and is_owner = false
      and is_admin = false
  );
$$;
