-- Original price (MRP) next to the selling price.
--   price           = what the customer pays (selling price; used by the cart, checkout and orders)
--   original_price  = optional "was" price, shown struck through on the shop when it's higher
-- Safe to run more than once.

alter table public.products
  add column if not exists original_price integer;

alter table public.products drop constraint if exists products_original_price_check;
alter table public.products
  add constraint products_original_price_check
  check (original_price is null or (original_price >= 0 and (price is null or original_price >= price)));
