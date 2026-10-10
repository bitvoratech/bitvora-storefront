-- ============================================
-- GROWTH FEATURES
--   1. Restock alerts: shoppers leave a WhatsApp number on sold-out items;
--      merchants see who's waiting and message them when it's back.
--   2. Recent sales: real "N sold this week" social proof + bestseller badges.
--   3. Typo-tolerant search: trigram matching for "did you mean" results.
-- ============================================


-- ============================================
-- 1. RESTOCK REQUESTS
-- Inserts only happen through the storefront server (service role), which
-- checks the product is really sold out and rate-limits by IP.
-- ============================================
create table restock_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  customer_name text check (customer_name is null or char_length(customer_name) <= 100),
  customer_phone text not null check (char_length(customer_phone) between 7 and 20),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

create index restock_requests_store_pending_idx on restock_requests(store_id) where notified_at is null;
create index restock_requests_product_idx on restock_requests(product_id);
-- One pending request per phone per product.
create unique index restock_requests_pending_unique
  on restock_requests(product_id, customer_phone) where notified_at is null;

alter table restock_requests enable row level security;

create policy "Merchants can view restock requests for their own stores"
  on restock_requests for select
  using (
    store_id in (
      select s.id from stores s
      join merchants m on m.id = s.merchant_id
      where m.user_id = auth.uid()
    )
  );

create policy "Merchants can update restock requests for their own stores"
  on restock_requests for update
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

create policy "Suspended merchants cannot update restock requests"
  on restock_requests as restrictive for update to authenticated
  using (public.current_merchant_is_active())
  with check (public.current_merchant_is_active());

revoke all on public.restock_requests from anon;
revoke insert, update, delete on public.restock_requests from authenticated;
grant select on public.restock_requests to authenticated;
-- Merchants may only stamp a request as notified.
grant update (notified_at) on public.restock_requests to authenticated;


-- ============================================
-- 2. RECENT SALES (units per product, non-cancelled orders)
-- Customers can't read orders, so this exposes only aggregate unit counts,
-- and only for published, active stores.
-- ============================================
create or replace function public.recent_product_sales(p_store_id uuid, p_days int default 7)
returns table(product_id uuid, units bigint)
language sql
stable
security definer
set search_path = public
as $$
  select oi.product_id, sum(oi.quantity)::bigint as units
  from order_items oi
  join orders o on o.id = oi.order_id
  join stores s on s.id = o.store_id
  where o.store_id = p_store_id
    and s.is_published = true
    and public.is_merchant_active(s.merchant_id)
    and o.status <> 'cancelled'
    and o.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 90))
    and oi.product_id is not null
  group by oi.product_id;
$$;

revoke execute on function public.recent_product_sales(uuid, int) from public;
grant execute on function public.recent_product_sales(uuid, int) to anon, authenticated, service_role;


-- ============================================
-- 3. TYPO-TOLERANT SEARCH
-- On Supabase pg_trgm lives in the "extensions" schema (or may already be in
-- public), so resolve it through search_path rather than a fixed schema.
-- ============================================
create extension if not exists pg_trgm with schema extensions;

set search_path = public, extensions;
create index if not exists products_name_trgm_idx on public.products using gin (lower(name) gin_trgm_ops);
reset search_path;

-- SECURITY INVOKER: the caller's RLS applies, so shoppers only ever get
-- active products of published stores.
create or replace function public.similar_products(p_store_id uuid, p_query text, p_limit int default 12)
returns setof public.products
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (select lower(trim(coalesce(p_query, ''))) as text)
  select p.*
  from products p, q
  where p.store_id = p_store_id
    and p.is_active = true
    and char_length(q.text) between 2 and 60
    and (
      word_similarity(q.text, lower(p.name)) > 0.3
      or word_similarity(q.text, lower(coalesce(p.category, ''))) > 0.4
    )
  order by greatest(
    word_similarity(q.text, lower(p.name)),
    word_similarity(q.text, lower(coalesce(p.category, '')))
  ) desc
  limit least(greatest(coalesce(p_limit, 12), 1), 24);
$$;

revoke execute on function public.similar_products(uuid, text, int) from public;
grant execute on function public.similar_products(uuid, text, int) to anon, authenticated, service_role;
