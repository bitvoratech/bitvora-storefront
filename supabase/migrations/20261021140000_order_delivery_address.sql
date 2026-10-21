-- Where to deliver. Before this, checkout only collected a delivery area,
-- so merchants had to call every customer to ask for the address.
-- Written by the storefront's checkout action (service role) right after
-- create_order returns; customers can't write orders directly.
alter table public.orders
  add column if not exists delivery_address text
    check (delivery_address is null or char_length(delivery_address) <= 300);
