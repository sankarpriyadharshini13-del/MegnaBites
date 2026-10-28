-- Customer reviews (one per order, 1–5 stars + optional message). Run after 20261026000000_checkout.sql.
--
--   * Customers can review only their own, non-cancelled orders, once each, and read their own reviews.
--   * The reviewer's name and account are filled in by the database, so they can't be faked.
--   * Admins can read (and remove) every review.

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  order_number  bigint not null unique references public.orders (number) on delete cascade,
  user_id       uuid references auth.users (id) on delete set null,
  customer_name text not null default '',
  rating        smallint not null check (rating between 1 and 5),
  message       text not null default '' check (length(message) <= 1000),
  created_at    timestamptz not null default now()
);
create index if not exists reviews_created_idx on public.reviews (created_at desc);

create or replace function public.set_review_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := (select auth.uid());
  new.message := btrim(coalesce(new.message, ''));
  new.created_at := now();
  new.customer_name := coalesce(
    (select nullif(btrim(o.ship_name), '') from public.orders o where o.number = new.order_number),
    (select nullif(btrim(c.name), '') from public.orders o join public.customers c on c.id = o.customer_id where o.number = new.order_number),
    'Customer'
  );
  return new;
end;
$$;
revoke execute on function public.set_review_author() from public, anon, authenticated;

drop trigger if exists reviews_set_author on public.reviews;
create trigger reviews_set_author before insert on public.reviews
  for each row execute function public.set_review_author();

alter table public.reviews enable row level security;

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists reviews_own_read on public.reviews;
create policy reviews_own_read on public.reviews
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists reviews_own_insert on public.reviews;
create policy reviews_own_insert on public.reviews
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.orders o join public.customers c on c.id = o.customer_id
      where o.number = reviews.order_number and c.user_id = (select auth.uid()) and o.status <> 'Cancelled'
    )
  );
