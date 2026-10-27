-- Plan features, enforced in the database as well as the app.
--
-- 1. Starter customization: the pricing page gives Starter the brand color,
--    logo, homepage hero and social links. The about section, featured
--    collections, closing banner, font pairing, heading size, grid density
--    and showing/hiding/reordering sections are Growth and Pro only.
--    Mirrors hasFullCustomization() in packages/lib/src/plan-features.ts.
-- 2. A merchant with no plan on record is held to Starter limits instead of
--    getting unlimited stores and products.
--
-- Needs 20261026090000_optional_compliance.sql first.

create or replace function public.plan_has_full_customization(p_plan text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_plan in ('growth', 'pro'), false);
$$;

create or replace function public.store_has_full_customization(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select public.plan_has_full_customization(m.plan)
    from stores s join merchants m on m.id = s.merchant_id
    where s.id = p_store_id
  ), false);
$$;

revoke execute on function public.store_has_full_customization(uuid) from public;
grant execute on function public.store_has_full_customization(uuid) to authenticated, service_role;


-- ============================================
-- 1a. FONTS, HEADING SIZE, GRID: Growth and Pro only
-- ============================================
-- Only a change is refused, so other store updates (name, bank details,
-- publishing) keep working for a Starter store that saved these earlier.
create or replace function public.enforce_plan_store_design()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.typography is distinct from old.typography or new.grid_density is distinct from old.grid_density)
     and not public.store_has_full_customization(new.id) then
    raise exception 'plan_feature: fonts, heading size and grid layout need the Growth plan'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_plan_store_design on public.stores;
create trigger enforce_plan_store_design
  before update on public.stores
  for each row execute function public.enforce_plan_store_design();


-- ============================================
-- 1b. SECTIONS: Starter edits the hero only, and can't hide or reorder
-- ============================================
create or replace function public.enforce_plan_sections()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.store_has_full_customization(new.store_id) then
    return new;
  end if;
  if new.type <> 'hero' then
    raise exception 'plan_feature: the about section, collections and banners need the Growth plan'
      using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and (new.position is distinct from old.position or new.is_visible is distinct from old.is_visible) then
    raise exception 'plan_feature: showing, hiding and reordering sections needs the Growth plan'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_plan_sections on public.sections;
create trigger enforce_plan_sections
  before insert or update on public.sections
  for each row execute function public.enforce_plan_sections();


-- ============================================
-- 2. NO PLAN ON RECORD = STARTER LIMITS
-- ============================================
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
        public.plan_store_limit(coalesce(m.plan, 'starter')) is null
        or (select count(*) from stores s where s.merchant_id = m.id) < public.plan_store_limit(coalesce(m.plan, 'starter'))
      )
  );
$$;

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
  select public.plan_product_limit(coalesce(m.plan, 'starter')) into v_limit
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

revoke execute on function public.current_merchant_can_create_store() from public;
grant execute on function public.current_merchant_can_create_store() to authenticated, service_role;
