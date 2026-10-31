-- ============================================
-- UNTRACKED STOCK AND PRICE PER SIZE
-- Asked for by building materials sellers, available to every store:
--  * track_stock = false: the product is made to order or always available,
--    so it never sells out and orders don't count stock down.
--  * size_prices: an optional price for any of the product's sizes
--    ({"2ft x 6ft": 85000, "3ft x 7ft": 120000}). A size without an entry
--    uses the product's own price.
-- ============================================

alter table public.products
  add column if not exists track_stock boolean not null default true,
  add column if not exists size_prices jsonb not null default '{}'::jsonb;

alter table public.products
  drop constraint if exists products_size_prices_shape,
  add constraint products_size_prices_shape check (
    jsonb_typeof(size_prices) = 'object' and octet_length(size_prices::text) <= 4000
  );


-- ============================================
-- CREATE ORDER: as in 20261024090000_product_sizes.sql, plus
--  * an untracked product skips the stock check and the stock update;
--  * the unit price is the picked size's price when the merchant set one.
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
  v_size text;
  v_price numeric;
  v_size_price text;
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

  -- Merge duplicate lines (same product and size), then lock products in a
  -- stable order so two concurrent checkouts can't both buy the last unit
  -- (or deadlock). Stock is shared across a product's sizes; re-reading the
  -- row each pass sees what earlier sizes of it already took.
  for v_item in
    select (i->>'productId')::uuid as product_id,
           nullif(left(trim(coalesce(i->>'size', '')), 40), '') as size,
           sum((i->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) as i
    group by 1, 2
    order by 1, 2
  loop
    select id, name, price, coalesce(stock_quantity, 0) as stock, sizes, track_stock, size_prices
    into v_product
    from products
    where id = v_item.product_id
      and store_id = p_store_id
      and is_active = true
    for update;

    if not found then
      raise exception 'One or more items are no longer available';
    end if;

    v_size := null;
    if cardinality(v_product.sizes) > 0 then
      if v_item.size is null then
        raise exception 'Choose a size for "%"', v_product.name;
      end if;
      select s into v_size
      from unnest(v_product.sizes) as s
      where lower(s) = lower(v_item.size)
      limit 1;
      if v_size is null then
        raise exception '"%" no longer comes in size %', v_product.name, v_item.size;
      end if;
    end if;

    v_price := v_product.price;
    if v_size is not null then
      v_size_price := v_product.size_prices->>v_size;
      if v_size_price ~ '^[0-9]+(\.[0-9]+)?$' and v_size_price::numeric > 0 then
        v_price := v_size_price::numeric;
      end if;
    end if;

    if v_product.track_stock then
      if v_product.stock < v_item.quantity then
        if v_product.stock <= 0 then
          raise exception '"%" is out of stock', v_product.name;
        end if;
        raise exception 'Only % of "%" left in stock', v_product.stock, v_product.name;
      end if;

      update products
      set stock_quantity = v_product.stock - v_item.quantity
      where id = v_product.id;
    end if;

    insert into order_items (order_id, product_id, product_name, size, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_size, v_item.quantity, v_price);

    v_subtotal := v_subtotal + v_price * v_item.quantity;
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
