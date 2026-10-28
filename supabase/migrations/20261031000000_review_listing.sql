-- Paging + summary for the website's reviews (home page section and /reviews). Run after
-- 20261030000000_review_publishing.sql. Safe to run more than once. Read-only; live reviews only.

-- Totals for the rating summary: how many live reviews, their average and the count per star.
create or replace function public.published_review_stats()
returns table (total integer, average numeric, r5 integer, r4 integer, r3 integer, r2 integer, r1 integer)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int,
         coalesce(round(avg(rating)::numeric, 1), 0),
         count(*) filter (where rating = 5)::int,
         count(*) filter (where rating = 4)::int,
         count(*) filter (where rating = 3)::int,
         count(*) filter (where rating = 2)::int,
         count(*) filter (where rating = 1)::int
  from public.reviews
  where published
$$;

-- One page of live reviews, newest first, optionally only one star rating.
create or replace function public.published_reviews_page(p_limit integer default 12, p_offset integer default 0, p_rating integer default null)
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
  where r.published and (p_rating is null or r.rating = p_rating)
  order by r.created_at desc, r.id
  limit least(greatest(coalesce(p_limit, 12), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke execute on function public.published_review_stats() from public;
revoke execute on function public.published_reviews_page(integer, integer, integer) from public;
grant execute on function public.published_review_stats() to anon, authenticated, service_role;
grant execute on function public.published_reviews_page(integer, integer, integer) to anon, authenticated, service_role;
