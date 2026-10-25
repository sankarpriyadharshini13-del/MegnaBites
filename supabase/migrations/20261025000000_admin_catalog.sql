-- Magna Eco Bites — admin panel data: products, orders, customers, refunds, settings,
-- admin roles and invitations. Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- Security model
--   * Only rows in public.admin_members are admins. The single 'owner' row is created by
--     scripts/create-admin.mjs (service role); clients can never insert into admin_members.
--   * Everything except visible products is admin-only through RLS, so the rules hold even if
--     someone calls the database directly with their own session.
--   * Invitations store only a SHA-256 hash of the token; accept_invite() is the only way to
--     become an invited admin.

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

/* ---------------------------------------------------------------- admin roles */

create table if not exists public.admin_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null check (role in ('owner', 'admin')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
-- At most one owner, ever.
create unique index if not exists admin_members_single_owner on public.admin_members ((role)) where role = 'owner';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_members m where m.user_id = (select auth.uid()));
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_members m where m.user_id = (select auth.uid()) and m.role = 'owner');
$$;

revoke execute on function public.is_admin(), public.is_owner() from public, anon;
grant execute on function public.is_admin(), public.is_owner() to authenticated;

alter table public.admin_members enable row level security;

drop policy if exists admin_members_read on public.admin_members;
create policy admin_members_read on public.admin_members
  for select to authenticated using ((select public.is_admin()));

-- The owner can remove invited admins (never the owner row).
drop policy if exists admin_members_owner_delete on public.admin_members;
create policy admin_members_owner_delete on public.admin_members
  for delete to authenticated using ((select public.is_owner()) and role = 'admin');

/* ---------------------------------------------------------------- invitations */

create table if not exists public.admin_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name        text,
  token_hash  text not null unique,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at  timestamptz
);

alter table public.admin_invites enable row level security;

drop policy if exists admin_invites_owner_all on public.admin_invites;
create policy admin_invites_owner_all on public.admin_invites
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()) and created_by = (select auth.uid()));

-- Public (token holder) pre-check used by the invite page. Reveals only a masked email.
create or replace function public.check_invite(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare inv public.admin_invites;
begin
  select * into inv from public.admin_invites where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if not found then return jsonb_build_object('valid', false, 'reason', 'not_found'); end if;
  if inv.revoked_at is not null then return jsonb_build_object('valid', false, 'reason', 'revoked'); end if;
  if inv.accepted_at is not null then return jsonb_build_object('valid', false, 'reason', 'used'); end if;
  if inv.expires_at < now() then return jsonb_build_object('valid', false, 'reason', 'expired'); end if;
  return jsonb_build_object(
    'valid', true,
    'name', inv.name,
    'email_hint', left(split_part(inv.email, '@', 1), 2) || '***@' || split_part(inv.email, '@', 2)
  );
end;
$$;

-- Accepts an invitation for the signed-in user. The invite must be unused, unexpired, not revoked,
-- and addressed to the (confirmed) email of the account that is accepting it.
create or replace function public.accept_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  inv public.admin_invites;
  u_email text;
  u_confirmed timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'not_signed_in'; end if;
  select * into inv from public.admin_invites
    where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') for update;
  if not found or inv.revoked_at is not null or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'invalid_invite';
  end if;
  select email, email_confirmed_at into u_email, u_confirmed from auth.users where id = (select auth.uid());
  if u_confirmed is null then raise exception 'email_not_confirmed'; end if;
  if lower(u_email) <> lower(inv.email) then raise exception 'invite_email_mismatch'; end if;
  insert into public.admin_members (user_id, email, name, role, invited_by)
    values ((select auth.uid()), u_email, inv.name, 'admin', inv.created_by)
    on conflict (user_id) do nothing;
  update public.admin_invites set accepted_at = now(), accepted_by = (select auth.uid()) where id = inv.id;
  return jsonb_build_object('accepted', true);
end;
$$;

revoke execute on function public.check_invite(text), public.accept_invite(text) from public;
grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to authenticated;

/* ------------------------------------------------------------------- products */

create table if not exists public.products (
  id               text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) <= 80),
  name             text not null check (length(btrim(name)) between 1 and 120),
  sku              text not null default '',
  price            integer check (price is null or price >= 0),
  stock            integer not null default 0 check (stock >= 0),
  pack_size        text not null default '',
  tag              text not null default '',
  description      text not null default '',
  long_description text not null default '',
  barcode          text unique,
  visible          boolean not null default false,
  images           text[] not null default '{}' check (cardinality(images) <= 5),
  color            text not null default '#c8602b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;

-- The storefront (anonymous visitors) can only ever see visible products.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated using (visible);

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

/* ------------------------------------------------------ customers and orders */

create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null default '',
  email      text not null default '',
  area       text,
  city       text not null default '',
  state      text not null default '',
  user_id    uuid references auth.users (id) on delete set null,
  since      timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  text        text not null check (length(btrim(text)) between 1 and 1000),
  at          timestamptz not null default now()
);

create table if not exists public.orders (
  number          bigint generated by default as identity (start with 1001) primary key,
  placed_at       timestamptz not null default now(),
  customer_id     uuid not null references public.customers (id) on delete restrict,
  shipping        integer not null default 0 check (shipping >= 0),
  method          text not null default 'UPI' check (method in ('UPI', 'Card', 'NetBanking')),
  status          text not null default 'New' check (status in ('New', 'Packed', 'Cancelled')),
  address         text not null default '',
  payment_id      text not null default '',
  payment_status  text not null default 'pending' check (payment_status in ('pending', 'captured', 'refunded', 'partial_refund')),
  payment_refunded integer not null default 0 check (payment_refunded >= 0)
);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_placed_idx on public.orders (placed_at desc);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_number bigint not null references public.orders (number) on delete cascade,
  product_id   text references public.products (id) on delete set null,
  name         text not null,
  pack_size    text not null default '',
  qty          integer not null check (qty > 0),
  price        integer not null check (price >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_number);

create table if not exists public.order_events (
  id           uuid primary key default gen_random_uuid(),
  order_number bigint not null references public.orders (number) on delete cascade,
  label        text not null,
  note         text,
  at           timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_number);

create table if not exists public.refunds (
  id           uuid primary key default gen_random_uuid(),
  order_number bigint not null references public.orders (number) on delete cascade,
  amount       integer not null check (amount > 0),
  reason       text not null,
  note         text not null default '',
  at           timestamptz not null default now()
);
create index if not exists refunds_order_idx on public.refunds (order_number);

create table if not exists public.stock_log (
  id         uuid primary key default gen_random_uuid(),
  at         timestamptz not null default now(),
  text       text not null,
  delta      integer not null,
  product_id text
);
create index if not exists stock_log_at_idx on public.stock_log (at desc);

create table if not exists public.app_settings (
  id         integer primary key check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- Admin-only tables.
do $$
declare t text;
begin
  foreach t in array array['customers', 'customer_notes', 'orders', 'order_items', 'order_events', 'refunds', 'stock_log', 'app_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || '_admin_all', t);
  end loop;
end $$;

/* --------------------------------------------------------------------- storage */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-assets', 'admin-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Public buckets serve files by URL without a read policy; only admins may write.
drop policy if exists admin_assets_insert on storage.objects;
create policy admin_assets_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'admin-assets' and (select public.is_admin()));
drop policy if exists admin_assets_update on storage.objects;
create policy admin_assets_update on storage.objects
  for update to authenticated using (bucket_id = 'admin-assets' and (select public.is_admin()));
drop policy if exists admin_assets_delete on storage.objects;
create policy admin_assets_delete on storage.objects
  for delete to authenticated using (bucket_id = 'admin-assets' and (select public.is_admin()));

/* ------------------------------------------------------------------ seed data */
-- The three products the storefront already shows, so the shop is not empty after migrating.
-- Prices/stock mirror the admin design; edit them in Admin → Products & Stock.

insert into public.products (id, name, sku, price, stock, pack_size, tag, description, long_description, barcode, visible, images, color, created_at)
values
  ('idli-podi', 'Idli Podi', 'MEB-IP-200', 180, 84, '200 g', 'Bestseller',
   'Traditional stone-ground idli podi — a lentil and spice blend.',
   'Our classic idli podi: a traditional lentil and spice blend, stone-ground in small batches in Kolathur, Chennai. Stir into sesame or ghee oil and serve with idli, dosa or hot rice.',
   '890123450017', true, '{}', '#c8602b', now() - interval '3 minutes'),
  ('country-sugar', 'Country Sugar', 'MEB-CS-1000', 120, 40, '1 kg', 'Unrefined',
   'Minimally processed country sugar with a rich, rustic flavour.',
   'Minimally processed country sugar, packed in Kolathur, Chennai. A rustic alternative for tea, coffee, payasam and everyday sweets.',
   '890123450024', true, '{}', '#d9a441', now() - interval '2 minutes'),
  ('moringa-idli-podi', 'Moringa Idli Podi', 'MEB-MP-200', 210, 46, '200 g', 'New',
   'Classic idli podi blended with moringa leaf — our newest blend.',
   'Our classic idli podi blended with moringa leaf. Stone-ground in small batches in Kolathur, Chennai — traditional taste, naturally yours.',
   '890123450031', true, array['/images/products/moringa-idli-podi.jpg'], '#3b5a3a', now() - interval '1 minute')
on conflict (id) do nothing;
