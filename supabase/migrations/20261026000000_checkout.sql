-- Online checkout (dummy test payments now, Razorpay later), delivery details on orders and the Delivered status.
-- pending_checkouts.razorpay_order_id holds the payment gateway's order id ("dummy_…" for test payments).
-- Run after 20261025010000_customers_from_profiles.sql.
--
-- Security model
--   * pending_checkouts and finalize_checkout() are reachable only with the service-role key, which
--     lives on the server. The server calls finalize_checkout() only after it has verified Razorpay's
--     payment signature, so a customer can never create a "paid" order without paying.

/* ------------------------------------------------------------------ orders */

alter table public.orders add column if not exists email text not null default '';
alter table public.orders add column if not exists ship_name text not null default '';
alter table public.orders add column if not exists ship_phone text not null default '';
alter table public.orders add column if not exists ship_city text not null default '';
alter table public.orders add column if not exists ship_state text not null default '';
alter table public.orders add column if not exists ship_pincode text not null default '';
alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists delivered_at timestamptz;
create unique index if not exists orders_razorpay_order_key on public.orders (razorpay_order_id);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('New', 'Packed', 'Delivered', 'Cancelled'));

alter table public.orders drop constraint if exists orders_method_check;
alter table public.orders add constraint orders_method_check
  check (method in ('UPI', 'Card', 'NetBanking', 'Wallet', 'Other'));

/* --------------------------------------------------------- pending checkouts */

create table if not exists public.pending_checkouts (
  id                uuid primary key default gen_random_uuid(),
  razorpay_order_id text not null unique,
  user_id           uuid references auth.users (id) on delete set null,
  email             text not null,
  name              text not null,
  phone             text not null,
  address           text not null,
  city              text not null,
  state             text not null,
  pincode           text not null,
  items             jsonb not null,
  subtotal          integer not null check (subtotal >= 0),
  shipping          integer not null default 0 check (shipping >= 0),
  amount            integer not null check (amount > 0),
  status            text not null default 'created' check (status in ('created', 'paid')),
  order_number      bigint references public.orders (number) on delete set null,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);

-- RLS on with no policies: only the service role (server) can touch it.
alter table public.pending_checkouts enable row level security;

/* ------------------------------------------------------- finalize_checkout() */

-- Turns a paid checkout into an order, in one transaction: customer details, order, items, timeline,
-- stock deduction and stock log. Safe to call twice (browser callback + webhook): the second call
-- returns the existing order with created = false.
drop function if exists public.finalize_checkout(text, text, text);
create or replace function public.finalize_checkout(p_razorpay_order_id text, p_payment_id text, p_method text, p_gateway text default 'Razorpay')
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  c public.pending_checkouts;
  cust uuid;
  n bigint;
  m text := case when p_method in ('UPI', 'Card', 'NetBanking', 'Wallet') then p_method else 'Other' end;
begin
  select * into c from public.pending_checkouts where razorpay_order_id = p_razorpay_order_id for update;
  if not found then raise exception 'checkout_not_found'; end if;
  if c.order_number is not null then
    return jsonb_build_object('order_number', c.order_number, 'created', false);
  end if;

  select id into cust from public.customers where user_id = c.user_id;
  if cust is null then
    insert into public.customers (user_id, name, phone, email, city, state)
    values (c.user_id, c.name, c.phone, c.email, c.city, c.state)
    returning id into cust;
  else
    update public.customers
      set phone = coalesce(nullif(c.phone, ''), phone),
          city = c.city,
          state = c.state
      where id = cust;
  end if;

  insert into public.orders (
    customer_id, shipping, method, status, address, payment_id, payment_status,
    email, ship_name, ship_phone, ship_city, ship_state, ship_pincode, razorpay_order_id
  ) values (
    cust, c.shipping, m, 'New',
    c.address || ', ' || c.city || ', ' || c.state || ' – ' || c.pincode,
    p_payment_id, 'captured',
    c.email, c.name, c.phone, c.city, c.state, c.pincode, c.razorpay_order_id
  ) returning number into n;

  insert into public.order_items (order_number, product_id, name, pack_size, qty, price)
  select n,
         (select p.id from public.products p where p.id = x ->> 'product_id'),
         x ->> 'name', coalesce(x ->> 'pack_size', ''), (x ->> 'qty')::int, (x ->> 'price')::int
  from jsonb_array_elements(c.items) x;

  -- Payment is already taken, so never fail here: stock bottoms out at 0 and the log shows the sale.
  update public.products p
     set stock = greatest(p.stock - q.qty, 0)
    from (select x ->> 'product_id' as pid, sum((x ->> 'qty')::int) as qty
            from jsonb_array_elements(c.items) x group by 1) q
   where p.id = q.pid;

  insert into public.stock_log (text, delta, product_id)
  select 'Order #' || n || ' · ' || (x ->> 'name') || ' ×' || (x ->> 'qty'), -((x ->> 'qty')::int), x ->> 'product_id'
  from jsonb_array_elements(c.items) x;

  insert into public.order_events (order_number, label, note)
  values (n, 'Order placed & paid', m || ' · ' || coalesce(nullif(p_gateway, ''), 'Razorpay'));

  update public.pending_checkouts set status = 'paid', paid_at = now(), order_number = n where id = c.id;
  return jsonb_build_object('order_number', n, 'created', true);
end;
$$;

-- Supabase grants EXECUTE on new functions to anon/authenticated by default; remove that.
revoke execute on function public.finalize_checkout(text, text, text, text) from public, anon, authenticated;
grant execute on function public.finalize_checkout(text, text, text, text) to service_role;

/* ------------------------------------------------------ customers' own orders */
-- Signed-in customers can read their own orders (My orders page). Admin policies are unchanged;
-- these are additional SELECT-only policies, so customers can never change orders.

drop policy if exists customers_own_read on public.customers;
create policy customers_own_read on public.customers
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders
  for select to authenticated using (
    exists (select 1 from public.customers c where c.id = orders.customer_id and c.user_id = (select auth.uid()))
  );

drop policy if exists order_items_own_read on public.order_items;
create policy order_items_own_read on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o join public.customers c on c.id = o.customer_id
      where o.number = order_items.order_number and c.user_id = (select auth.uid())
    )
  );

drop policy if exists order_events_own_read on public.order_events;
create policy order_events_own_read on public.order_events
  for select to authenticated using (
    exists (
      select 1 from public.orders o join public.customers c on c.id = o.customer_id
      where o.number = order_events.order_number and c.user_id = (select auth.uid())
    )
  );
