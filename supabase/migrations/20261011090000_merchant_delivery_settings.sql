-- ============================================
-- MERCHANT-MANAGED DELIVERY & CHECKOUT SETTINGS
-- Replaces the hardcoded, Lagos-only delivery zone list in the storefront.
-- Each store now owns:
--   * its delivery areas and fees (delivery_zones)
--   * whether pickup is offered, and where/how
--   * an optional free-delivery threshold and a note shown at checkout
--   * whether pay-on-delivery is accepted
-- create_order now derives the delivery fee from these rows, so the fee can
-- never come from the client.
-- ============================================

alter table stores
  add column pickup_enabled boolean not null default true,
  add column pickup_address text,
  add column delivery_note text,
  add column free_delivery_min numeric(12,2),
  add column pay_on_delivery_enabled boolean not null default true;

alter table stores
  add constraint stores_free_delivery_min_nonneg check (free_delivery_min is null or free_delivery_min >= 0),
  add constraint stores_pickup_address_len check (pickup_address is null or char_length(pickup_address) <= 300),
  add constraint stores_delivery_note_len check (delivery_note is null or char_length(delivery_note) <= 300);


-- ============================================
-- DELIVERY ZONES
-- ============================================
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  area text not null check (char_length(trim(area)) between 1 and 80),
  fee numeric(12,2) not null check (fee >= 0 and fee <= 1000000),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index delivery_zones_store_id_idx on delivery_zones(store_id);
create unique index delivery_zones_store_area_idx on delivery_zones(store_id, lower(area));

create trigger set_updated_at_delivery_zones before update on delivery_zones
  for each row execute function set_updated_at();

alter table delivery_zones enable row level security;

create policy "Merchants can manage delivery zones of their own stores"
  on delivery_zones for all
  using (
    store_id in (
      select s.id from stores s
      join merchants m on m.id = s.merchant_id
      where m.user_id = auth.uid()
    )
  )
  with check (
    store_id in (
      select s.id from stores s
      join merchants m on m.id = s.merchant_id
      where m.user_id = auth.uid()
    )
  );

create policy "Suspended merchants cannot insert delivery zones"
  on delivery_zones as restrictive for insert to authenticated
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot update delivery zones"
  on delivery_zones as restrictive for update to authenticated
  using (public.current_merchant_is_active())
  with check (public.current_merchant_is_active());

create policy "Suspended merchants cannot delete delivery zones"
  on delivery_zones as restrictive for delete to authenticated
  using (public.current_merchant_is_active());

create policy "Public can view delivery zones of published stores"
  on delivery_zones for select
  using (
    store_id in (
      select id from stores
      where is_published = true and public.is_merchant_active(merchant_id)
    )
  );

grant select on public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;
revoke insert, update, delete on public.delivery_zones from anon;

-- Existing stores were operating on the old hardcoded Lagos list; carry it
-- over so their checkout keeps working. Merchants can edit or delete these.
insert into delivery_zones (store_id, area, fee, position)
select s.id, z.area, z.fee, z.position
from stores s
cross join (values
  ('Yaba', 1500, 0),
  ('Surulere', 2000, 1),
  ('Ikeja', 2000, 2),
  ('Lekki Phase 1', 3000, 3),
  ('Victoria Island', 3000, 4),
  ('Ajah', 3500, 5),
  ('Ikorodu', 4000, 6),
  ('Other (Lagos)', 2500, 7)
) as z(area, fee, position);


-- ============================================
-- SAVE DELIVERY SETTINGS (atomic replace)
-- SECURITY INVOKER: the caller's RLS applies, so merchants can only touch
-- their own (non-suspended) stores.
-- p_zones shape: [{ "area": "Yaba", "fee": 1500 }, ...]
-- ============================================
create or replace function public.save_delivery_settings(
  p_store_id uuid,
  p_pickup_enabled boolean,
  p_pickup_address text,
  p_delivery_note text,
  p_free_delivery_min numeric,
  p_pay_on_delivery_enabled boolean,
  p_zones jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_updated int;
begin
  if p_zones is null or jsonb_typeof(p_zones) <> 'array' then
    raise exception 'Invalid delivery areas';
  end if;
  if jsonb_array_length(p_zones) > 50 then
    raise exception 'You can add up to 50 delivery areas';
  end if;
  if coalesce(p_pickup_enabled, false) = false and jsonb_array_length(p_zones) = 0 then
    raise exception 'Turn on pickup or add at least one delivery area';
  end if;

  update stores set
    pickup_enabled = coalesce(p_pickup_enabled, false),
    pickup_address = nullif(trim(p_pickup_address), ''),
    delivery_note = nullif(trim(p_delivery_note), ''),
    free_delivery_min = p_free_delivery_min,
    pay_on_delivery_enabled = coalesce(p_pay_on_delivery_enabled, false)
  where id = p_store_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Store not found';
  end if;

  delete from delivery_zones where store_id = p_store_id;

  insert into delivery_zones (store_id, area, fee, position)
  select p_store_id, trim(z->>'area'), (z->>'fee')::numeric, (t.ord - 1)::int
  from jsonb_array_elements(p_zones) with ordinality as t(z, ord);
end;
$$;

revoke execute on function public.save_delivery_settings(uuid, boolean, text, text, numeric, boolean, jsonb) from public, anon;
grant execute on function public.save_delivery_settings(uuid, boolean, text, text, numeric, boolean, jsonb) to authenticated;


-- ============================================
-- CREATE ORDER: fee now comes from the store's own delivery zones.
-- Same signature as before; p_delivery_fee is accepted but ignored.
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
  v_store record;
  v_fee numeric := 0;
  v_area text;
  v_subtotal numeric := 0;
  v_total numeric;
  v_order_id uuid;
  v_item record;
  v_product record;
begin
  select merchant_id, is_published, pickup_enabled, pay_on_delivery_enabled, free_delivery_min
  into v_store
  from stores where id = p_store_id;

  if not found or v_store.is_published is not true or not public.is_merchant_active(v_store.merchant_id) then
    raise exception 'Store is not available';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Name and phone number are required';
  end if;

  if p_delivery_method is null or p_delivery_method not in ('pickup', 'delivery') then
    raise exception 'Invalid delivery method';
  end if;

  if p_delivery_method = 'pickup' then
    if v_store.pickup_enabled is not true then
      raise exception 'This store does not offer pickup';
    end if;
  else
    select area, fee into v_area, v_fee
    from delivery_zones
    where store_id = p_store_id and lower(area) = lower(trim(coalesce(p_delivery_area, '')));
    if not found then
      raise exception 'This store does not deliver to that area';
    end if;
  end if;

  if p_payment_method is null or p_payment_method not in ('bank_transfer', 'pay_on_delivery') then
    raise exception 'Invalid payment method';
  end if;

  if p_payment_method = 'pay_on_delivery' and v_store.pay_on_delivery_enabled is not true then
    raise exception 'This store does not accept pay on delivery';
  end if;

  if p_payment_method = 'bank_transfer' and coalesce(p_payment_proof_url, '') = '' then
    raise exception 'Proof of payment is required for bank transfers';
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
    p_delivery_method, v_area, 0, 0, 0,
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

  if p_delivery_method = 'delivery'
     and v_store.free_delivery_min is not null
     and v_subtotal >= v_store.free_delivery_min then
    v_fee := 0;
  end if;

  v_total := v_subtotal + v_fee;
  update orders
  set subtotal = v_subtotal, delivery_fee = v_fee, total = v_total
  where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'total', v_total, 'delivery_fee', v_fee);
end;
$$;

revoke execute on function public.create_order(
  uuid, text, text, text, text, text, numeric, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.create_order(
  uuid, text, text, text, text, text, numeric, text, text, jsonb
) to service_role;


-- ============================================
-- ORDER CONFIRMATION: include delivery method/area so the customer page can
-- show pickup details.
-- ============================================
create or replace function public.get_order_confirmation(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'payment_method', o.payment_method,
    'payment_proof_url', o.payment_proof_url,
    'delivery_method', o.delivery_method,
    'delivery_area', o.delivery_area,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'status', o.status,
    'order_items', coalesce(
      (select jsonb_agg(jsonb_build_object(
         'id', oi.id,
         'product_name', oi.product_name,
         'quantity', oi.quantity,
         'unit_price', oi.unit_price
       ))
       from order_items oi
       where oi.order_id = o.id),
      '[]'::jsonb
    )
  )
  from orders o
  where o.id = p_order_id;
$$;

grant execute on function public.get_order_confirmation(uuid) to anon, authenticated;
