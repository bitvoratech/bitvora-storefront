-- ============================================
-- SECURITY HARDENING
--   1. Merchants can no longer write privileged columns on their own row
--      (is_owner, is_suspended, verification_*, phone_verified_at).
--   2. OTP rows and the verification audit log are server-only.
--   3. Store creation requires a verified, non-suspended merchant.
--   4. Suspension actually takes effect: suspended merchants can't write,
--      and their stores disappear from the public storefront.
--   5. create_order validates quantities/methods/fees, enforces and
--      decrements stock, and is callable only by the server (service role).
--   6. Basic data-integrity check constraints.
-- ============================================


-- ============================================
-- 1. MERCHANTS: column-level write access
-- ============================================
-- The merchants row is created by the on_auth_user_created trigger, so users
-- never need to INSERT it themselves (and could otherwise set is_owner).
drop policy if exists "Merchants can insert their own record" on merchants;
revoke insert on public.merchants from anon, authenticated;

-- RLS limits *which rows* a merchant can update; column privileges limit
-- *which fields*. Everything privileged is written via the service role.
revoke update on public.merchants from anon, authenticated;
grant update (full_name, phone, business_name, avatar_url) on public.merchants to authenticated;

-- Changing your phone number invalidates the previous phone verification,
-- unless the same update is the one setting phone_verified_at (OTP confirm).
create or replace function public.reset_phone_verification()
returns trigger
language plpgsql
as $$
begin
  if new.phone is distinct from old.phone
     and new.phone_verified_at is not distinct from old.phone_verified_at then
    new.phone_verified_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists reset_phone_verification on merchants;
create trigger reset_phone_verification
  before update of phone on merchants
  for each row execute function public.reset_phone_verification();


-- ============================================
-- 2. OTPs + VERIFICATION AUDIT LOG: server-only writes
-- ============================================
-- Merchants could previously read their own code_hash (a 6-digit code is
-- trivially brute-forced offline) and reset their own attempt counter.
drop policy if exists "Merchants can manage their own OTP rows" on merchant_otps;
revoke all on public.merchant_otps from anon, authenticated;

-- Merchants could previously insert their own "verified" audit rows.
drop policy if exists "Merchants can insert their own verification attempts" on merchant_verifications;
revoke insert, update, delete on public.merchant_verifications from anon, authenticated;


-- ============================================
-- 3/4. HELPERS for policies (security definer so anon can evaluate them
-- without needing read access to the merchants table)
-- ============================================
create or replace function public.is_merchant_active(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from merchants where id = p_merchant_id and is_suspended = false
  );
$$;

create or replace function public.current_merchant_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from merchants where user_id = auth.uid() and is_suspended = false
  );
$$;

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
  );
$$;

revoke execute on function public.is_merchant_active(uuid) from public;
revoke execute on function public.current_merchant_is_active() from public;
revoke execute on function public.current_merchant_can_create_store() from public;
grant execute on function public.is_merchant_active(uuid) to anon, authenticated, service_role;
grant execute on function public.current_merchant_is_active() to authenticated, service_role;
grant execute on function public.current_merchant_can_create_store() to authenticated, service_role;


-- ============================================
-- 3. STORE CREATION requires a verified, active merchant
-- (restrictive policies are AND-ed with the existing permissive ones)
-- ============================================
create policy "Only verified active merchants can create stores"
  on stores as restrictive for insert to authenticated
  with check (public.current_merchant_can_create_store());


-- ============================================
-- 4. SUSPENSION: block merchant writes...
-- ============================================
create policy "Suspended merchants cannot update stores"
  on stores as restrictive for update to authenticated
  using (public.current_merchant_is_active())
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot delete stores"
  on stores as restrictive for delete to authenticated
  using (public.current_merchant_is_active());

create policy "Suspended merchants cannot insert products"
  on products as restrictive for insert to authenticated
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot update products"
  on products as restrictive for update to authenticated
  using (public.current_merchant_is_active())
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot delete products"
  on products as restrictive for delete to authenticated
  using (public.current_merchant_is_active());

create policy "Suspended merchants cannot insert sections"
  on sections as restrictive for insert to authenticated
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot update sections"
  on sections as restrictive for update to authenticated
  using (public.current_merchant_is_active())
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot delete sections"
  on sections as restrictive for delete to authenticated
  using (public.current_merchant_is_active());

create policy "Suspended merchants cannot update orders"
  on orders as restrictive for update to authenticated
  using (public.current_merchant_is_active())
  with check (public.current_merchant_is_active());

-- ...and hide their stores from the public.
drop policy if exists "Public can view published stores" on stores;
create policy "Public can view published stores"
  on stores for select
  using (is_published = true and public.is_merchant_active(merchant_id));

drop policy if exists "Public can view sections of published stores" on sections;
create policy "Public can view sections of published stores"
  on sections for select
  using (
    is_visible = true
    and store_id in (
      select id from stores
      where is_published = true and public.is_merchant_active(merchant_id)
    )
  );

drop policy if exists "Public can view active products of published stores" on products;
create policy "Public can view active products of published stores"
  on products for select
  using (
    is_active = true
    and store_id in (
      select id from stores
      where is_published = true and public.is_merchant_active(merchant_id)
    )
  );


-- ============================================
-- 6. INTEGRITY CONSTRAINTS
-- NOT VALID: enforced for every new write, without failing this migration
-- on any legacy rows that already violate them.
-- ============================================
alter table products
  add constraint products_price_nonneg check (price >= 0) not valid,
  add constraint products_compare_at_price_nonneg check (compare_at_price is null or compare_at_price >= 0) not valid,
  add constraint products_stock_nonneg check (stock_quantity is null or stock_quantity >= 0) not valid;

alter table order_items
  add constraint order_items_quantity_positive check (quantity > 0) not valid,
  add constraint order_items_unit_price_nonneg check (unit_price >= 0) not valid;

alter table orders
  add constraint orders_amounts_nonneg check (subtotal >= 0 and total >= 0 and coalesce(delivery_fee, 0) >= 0) not valid,
  add constraint orders_delivery_method_valid check (delivery_method in ('pickup', 'delivery')) not valid,
  add constraint orders_payment_method_valid check (payment_method in ('bank_transfer', 'paystack', 'pay_on_delivery')) not valid,
  add constraint orders_status_valid check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) not valid;


-- ============================================
-- 5. CREATE ORDER (replaces the previous version)
-- Only the storefront server calls this, via the service role, after it has
-- rate-limited the request and computed the delivery fee from its zone table.
-- ============================================
create or replace function public.create_order(
  p_store_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_method text,
  p_delivery_area text,
  p_delivery_fee numeric,
  p_payment_method text,
  p_payment_proof_url text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_merchant_id uuid;
  v_published boolean;
  v_fee numeric := coalesce(p_delivery_fee, 0);
  v_subtotal numeric := 0;
  v_total numeric;
  v_order_id uuid;
  v_item record;
  v_product record;
begin
  select merchant_id, is_published into v_merchant_id, v_published
  from stores where id = p_store_id;

  if v_published is not true or not public.is_merchant_active(v_merchant_id) then
    raise exception 'Store is not available';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Name and phone number are required';
  end if;

  if p_delivery_method is null or p_delivery_method not in ('pickup', 'delivery') then
    raise exception 'Invalid delivery method';
  end if;

  if p_payment_method is null or p_payment_method not in ('bank_transfer', 'pay_on_delivery') then
    raise exception 'Invalid payment method';
  end if;

  if p_payment_method = 'bank_transfer' and coalesce(p_payment_proof_url, '') = '' then
    raise exception 'Proof of payment is required for bank transfers';
  end if;

  if v_fee < 0 then
    raise exception 'Invalid delivery fee';
  end if;
  if p_delivery_method = 'pickup' then
    v_fee := 0;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'Too many items in one order';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) as i
    where not coalesce(
      case when (i->>'quantity') ~ '^[0-9]{1,4}$'
           then (i->>'quantity')::int between 1 and 999
           else false end,
      false)
  ) then
    raise exception 'Invalid item quantity';
  end if;

  insert into orders (
    store_id, customer_name, customer_phone, customer_email,
    delivery_method, delivery_area, delivery_fee, subtotal, total,
    payment_method, payment_proof_url, status
  ) values (
    p_store_id, trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''),
    p_delivery_method, case when p_delivery_method = 'delivery' then p_delivery_area end,
    v_fee, 0, 0,
    p_payment_method, p_payment_proof_url, 'pending'
  ) returning id into v_order_id;

  -- Merge duplicate lines, then lock products in a stable order so two
  -- concurrent checkouts can't both buy the last unit (or deadlock).
  for v_item in
    select (i->>'productId')::uuid as product_id, sum((i->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) as i
    group by 1
    order by 1
  loop
    select id, name, price, coalesce(stock_quantity, 0) as stock
    into v_product
    from products
    where id = v_item.product_id
      and store_id = p_store_id
      and is_active = true
    for update;

    if not found then
      raise exception 'One or more items are no longer available';
    end if;

    if v_product.stock < v_item.quantity then
      if v_product.stock <= 0 then
        raise exception '"%" is out of stock', v_product.name;
      end if;
      raise exception 'Only % of "%" left in stock', v_product.stock, v_product.name;
    end if;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_item.quantity, v_product.price);

    update products
    set stock_quantity = v_product.stock - v_item.quantity
    where id = v_product.id;

    v_subtotal := v_subtotal + v_product.price * v_item.quantity;
  end loop;

  v_total := v_subtotal + v_fee;
  update orders set subtotal = v_subtotal, total = v_total where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'total', v_total);
end;
$$;

revoke execute on function public.create_order(
  uuid, text, text, text, text, text, numeric, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.create_order(
  uuid, text, text, text, text, text, numeric, text, text, jsonb
) to service_role;


-- ============================================
-- RESTOCK when an order is cancelled (and re-deduct if un-cancelled)
-- ============================================
create or replace function public.sync_stock_on_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update products p
    set stock_quantity = coalesce(p.stock_quantity, 0) + oi.quantity
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  elsif old.status = 'cancelled' and new.status is distinct from 'cancelled' then
    update products p
    set stock_quantity = greatest(coalesce(p.stock_quantity, 0) - oi.quantity, 0)
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_stock_on_order_status on orders;
create trigger sync_stock_on_order_status
  after update of status on orders
  for each row execute function public.sync_stock_on_order_status();
