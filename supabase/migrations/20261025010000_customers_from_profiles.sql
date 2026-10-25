-- Every site account (signed up from the storefront) becomes a row in public.customers, so it shows up
-- in Admin → Customers even before it has placed an order. Run after 20261025000000_admin_catalog.sql.

/* ---------------------------------------------------- keep the account email on the profile */

alter table public.profiles add column if not exists email text;

update public.profiles p set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end;
$$;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

/* ------------------------------------------------------------ profiles → customers */

create unique index if not exists customers_user_id_key on public.customers (user_id);

create or replace function public.sync_customer_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customers (user_id, name, phone, email, since)
  values (
    new.id,
    coalesce(nullif(btrim(new.full_name), ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Customer'),
    coalesce(new.phone, ''),
    coalesce(new.email, ''),
    new.created_at
  )
  on conflict (user_id) do update
    set name = excluded.name, phone = excluded.phone, email = excluded.email;
  return new;
end;
$$;
revoke execute on function public.sync_customer_from_profile() from public, anon, authenticated;

drop trigger if exists profiles_sync_customer on public.profiles;
create trigger profiles_sync_customer
  after insert or update of full_name, phone, email on public.profiles
  for each row execute function public.sync_customer_from_profile();

-- Supabase grants EXECUTE on new functions to anon directly, so revoking from PUBLIC isn't enough.
-- accept_invite() already refuses anonymous callers; this removes the grant as well.
revoke execute on function public.accept_invite(text) from anon;

-- Existing accounts.
insert into public.customers (user_id, name, phone, email, since)
select
  p.id,
  coalesce(nullif(btrim(p.full_name), ''), nullif(split_part(coalesce(p.email, ''), '@', 1), ''), 'Customer'),
  coalesce(p.phone, ''),
  coalesce(p.email, ''),
  p.created_at
from public.profiles p
on conflict (user_id) do nothing;
