-- Reviews on the website. Run after 20261028000000_reviews.sql. Safe to run more than once.
--
--   * Admin → Reviews has a "Live on website" switch per review (reviews.published, off by default).
--   * Only published reviews reach the website, through public.published_reviews(), which returns just
--     what the home page shows: first name + last initial, stars, message, products and date.
--     Shoppers never read the reviews table itself, so full names, accounts and order numbers stay private.
--   * Customers can't publish their own review: new reviews always start hidden.

alter table public.reviews add column if not exists published boolean not null default false;
alter table public.reviews add column if not exists published_at timestamptz;
create index if not exists reviews_published_idx on public.reviews (created_at desc) where published;

-- Same as before, plus: new reviews always start hidden.
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
  new.published := false;
  new.published_at := null;
  new.customer_name := coalesce(
    (select nullif(btrim(o.ship_name), '') from public.orders o where o.number = new.order_number),
    (select nullif(btrim(c.name), '') from public.orders o join public.customers c on c.id = o.customer_id where o.number = new.order_number),
    'Customer'
  );
  return new;
end;
$$;
revoke execute on function public.set_review_author() from public, anon, authenticated;

-- "Asha Krishnan" -> "Asha K.", "asha" -> "Asha", "" -> "Customer"
create or replace function public.review_display_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(btrim(p_name), '') = '' then 'Customer'
    when position(' ' in btrim(p_name)) = 0 then initcap(btrim(p_name))
    else initcap(split_part(btrim(p_name), ' ', 1)) || ' '
         || upper(left(regexp_replace(btrim(p_name), '^.*\s', ''), 1)) || '.'
  end
$$;

create or replace function public.published_reviews(p_limit integer default 12)
returns table (id uuid, name text, rating smallint, message text, products text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         public.review_display_name(r.customer_name),
         r.rating,
         r.message,
         coalesce((select string_agg(distinct i.name, ', ') from public.order_items i where i.order_number = r.order_number), ''),
         r.created_at
  from public.reviews r
  where r.published
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 12), 1), 50)
$$;
revoke execute on function public.published_reviews(integer) from public;
grant execute on function public.published_reviews(integer) to anon, authenticated, service_role;
