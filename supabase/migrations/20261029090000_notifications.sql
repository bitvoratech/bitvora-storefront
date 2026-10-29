-- ============================================
-- CONSOLE NOTIFICATIONS
-- The bell in the console header. Rows are written only by the triggers
-- below (security definer), never by the app: a merchant hears about new
-- orders, restock requests, products selling out, and the outcome of their
-- plan payments and NIN/CAC review; the owner and admins hear about plan
-- payments and identity details waiting for them to review.
-- Merchants can read their own rows and mark them read, nothing else.
-- ============================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  -- A console path to open when the notification is clicked.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_merchant_idx
  on public.notifications (merchant_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (merchant_id) where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Merchants can view their own notifications" on public.notifications;
create policy "Merchants can view their own notifications"
  on public.notifications for select
  to authenticated
  using (merchant_id in (select id from public.merchants where user_id = auth.uid()));

drop policy if exists "Merchants can mark their own notifications read" on public.notifications;
create policy "Merchants can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (merchant_id in (select id from public.merchants where user_id = auth.uid()))
  with check (merchant_id in (select id from public.merchants where user_id = auth.uid()));

-- Lets the bell update live without polling. The publication only exists
-- on Supabase, so skip it anywhere else.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ₦12,500 style amounts for notification text.
create or replace function public.notification_naira(amount numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select '₦' || to_char(coalesce(amount, 0), 'FM999,999,999,990');
$$;

-- Every platform owner and admin gets a copy.
create or replace function public.notify_staff(p_kind text, p_title text, p_body text, p_link text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into notifications (merchant_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link
  from merchants
  where is_owner or is_admin;
$$;
revoke execute on function public.notify_staff(text, text, text, text) from public, anon, authenticated;

-- New order -> the store's merchant.
create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select id, merchant_id, name into s from stores where id = new.store_id;
  if s.merchant_id is null then
    return new;
  end if;
  insert into notifications (merchant_id, kind, title, body, link)
  values (
    s.merchant_id,
    'new_order',
    'New order from ' || new.customer_name,
    public.notification_naira(new.total) || ' on ' || s.name
      || case when new.payment_method = 'bank_transfer' then ', paid by transfer. Check the proof.' else '.' end,
    '/stores/' || s.id || '/orders/' || new.id
  );
  return new;
end;
$$;

drop trigger if exists notify_new_order on public.orders;
create trigger notify_new_order
  after insert on public.orders
  for each row execute function public.notify_new_order();

-- A shopper asked to hear when a product is back -> the store's merchant.
create or replace function public.notify_restock_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  p_name text;
begin
  select id, merchant_id into s from stores where id = new.store_id;
  select name into p_name from products where id = new.product_id;
  if s.merchant_id is null then
    return new;
  end if;
  insert into notifications (merchant_id, kind, title, body, link)
  values (
    s.merchant_id,
    'restock_request',
    'Restock request for ' || coalesce(p_name, 'a product'),
    coalesce(new.customer_name, 'A shopper') || ' wants to know when it''s back in stock.',
    '/stores/' || s.id || '/products/' || new.product_id || '/edit'
  );
  return new;
end;
$$;

drop trigger if exists notify_restock_request on public.restock_requests;
create trigger notify_restock_request
  after insert on public.restock_requests
  for each row execute function public.notify_restock_request();

-- A product's stock just ran out -> the store's merchant.
create or replace function public.notify_out_of_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select id, merchant_id into s from stores where id = new.store_id;
  if s.merchant_id is null then
    return new;
  end if;
  insert into notifications (merchant_id, kind, title, body, link)
  values (
    s.merchant_id,
    'out_of_stock',
    new.name || ' is out of stock',
    'Restock it so shoppers can order it again.',
    '/stores/' || s.id || '/products/' || new.id || '/edit'
  );
  return new;
end;
$$;

drop trigger if exists notify_out_of_stock on public.products;
create trigger notify_out_of_stock
  after update of stock_quantity on public.products
  for each row
  when (coalesce(old.stock_quantity, 0) > 0 and coalesce(new.stock_quantity, 0) <= 0)
  execute function public.notify_out_of_stock();

-- Plan payments by bank transfer: staff hear about new ones, the merchant
-- hears when it's confirmed or rejected.
create or replace function public.notify_plan_transfer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m_name text;
  plan_name text := initcap(new.plan);
begin
  if tg_op = 'INSERT' then
    select coalesce(business_name, full_name) into m_name from merchants where id = new.merchant_id;
    perform public.notify_staff(
      'staff_plan_transfer',
      'Plan payment to confirm',
      coalesce(m_name, 'A merchant') || ' says they sent ' || public.notification_naira(new.amount)
        || ' for ' || plan_name || case when new.kind = 'upgrade' then ' (upgrade).' else '.' end,
      '/owner/payments'
    );
  elsif new.status is distinct from old.status and new.status = 'confirmed' then
    insert into notifications (merchant_id, kind, title, body, link)
    values (
      new.merchant_id,
      'plan_payment_confirmed',
      'Payment confirmed',
      'Your ' || public.notification_naira(new.amount) || ' transfer was confirmed. '
        || plan_name || ' is active.',
      '/billing'
    );
  elsif new.status is distinct from old.status and new.status = 'rejected' then
    insert into notifications (merchant_id, kind, title, body, link)
    values (
      new.merchant_id,
      'plan_payment_rejected',
      'Payment not confirmed',
      coalesce(nullif(new.review_note, ''), 'We couldn''t find your ' || public.notification_naira(new.amount) || ' transfer.')
        || ' Check the details and try again.',
      '/billing'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_plan_transfer on public.plan_transfers;
create trigger notify_plan_transfer
  after insert or update of status on public.plan_transfers
  for each row execute function public.notify_plan_transfer();

-- NIN/CAC review: staff hear about new submissions, the merchant hears the result.
create or replace function public.notify_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status = 'pending' then
    perform public.notify_staff(
      'staff_verification',
      'Identity details to review',
      coalesce(new.business_name, new.full_name) || ' sent their NIN and CAC number.',
      '/owner/verifications'
    );
  elsif new.verification_status = 'verified' then
    insert into notifications (merchant_id, kind, title, body, link)
    values (new.id, 'verification_approved', 'You''re a verified seller',
      'Your NIN and CAC were approved. Your stores now show the Verified badge.', '/');
  elsif new.verification_status = 'failed' then
    insert into notifications (merchant_id, kind, title, body, link)
    values (new.id, 'verification_rejected', 'Identity details not approved',
      coalesce(nullif(new.verification_note, ''), 'Check your NIN and CAC number and send them again.'), '/verify');
  end if;
  return new;
end;
$$;

drop trigger if exists notify_verification on public.merchants;
create trigger notify_verification
  after update of verification_status on public.merchants
  for each row
  when (new.verification_status is distinct from old.verification_status)
  execute function public.notify_verification();

revoke execute on function public.notify_new_order() from public, anon, authenticated;
revoke execute on function public.notify_restock_request() from public, anon, authenticated;
revoke execute on function public.notify_out_of_stock() from public, anon, authenticated;
revoke execute on function public.notify_plan_transfer() from public, anon, authenticated;
revoke execute on function public.notify_verification() from public, anon, authenticated;

-- A new seller signed up -> staff.
create or replace function public.notify_new_merchant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (new.is_owner or new.is_admin) then
    perform public.notify_staff(
      'staff_new_merchant',
      'New seller signed up',
      coalesce(nullif(new.business_name, ''), nullif(new.full_name, ''), 'A new seller') || ' just created an account.',
      '/owner/merchants/' || new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_new_merchant on public.merchants;
create trigger notify_new_merchant
  after insert on public.merchants
  for each row execute function public.notify_new_merchant();

revoke execute on function public.notify_new_merchant() from public, anon, authenticated;
