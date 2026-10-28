"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";

/**
 * "Add to Cart" until the product is in the cart, then a [-] qty [+] stepper bound to the cart line.
 * Going below 1 removes the line and brings the button back.
 */
export default function AddToCartButton({
  productId,
  name,
  className = "",
  stepperClassName = "",
  disabled = false,
  compact = false,
}: {
  productId: string;
  name: string;
  className?: string;
  /** Layout classes for the stepper (width / flex); its height matches the button. */
  stepperClassName?: string;
  disabled?: boolean;
  /** Short "Add" / "Sold out" label for tight layouts such as product cards. */
  compact?: boolean;
}) {
  const { lines, add, setQuantity, remove, maxQty, hydrated } = useCart();
  const { getById } = useProducts();
  const qty = lines.find((l) => l.product.id === productId)?.quantity ?? 0;
  const stock = getById(productId)?.stock;
  const max = stock == null ? maxQty : Math.min(maxQty, Math.max(0, stock));

  // Keep keyboard focus on the control the customer is using when it swaps between button and stepper.
  const focusNext = useRef<"stepper" | "button" | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const inCart = hydrated && qty > 0;
  useEffect(() => {
    if (focusNext.current === "stepper" && inCart) plusRef.current?.focus();
    if (focusNext.current === "button" && !inCart) buttonRef.current?.focus();
    focusNext.current = null;
  }, [inCart]);

  if (inCart) {
    const size = compact ? "h-10" : "h-12";
    const btn = `focus-ring grid ${size} ${compact ? "w-10" : "w-12"} shrink-0 place-items-center rounded-full transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`;
    const atMax = qty >= max;
    return (
      <div
        role="group"
        aria-label={`${name} quantity in cart`}
        className={`inline-flex ${size} items-center justify-between rounded-full bg-clay text-white ${compact ? "w-[7.5rem]" : "w-full sm:w-56"} ${stepperClassName}`}
      >
        <button
          type="button"
          className={btn}
          aria-label={qty === 1 ? `Remove ${name} from cart` : `Decrease quantity of ${name}`}
          onClick={() => {
            if (qty === 1) {
              focusNext.current = "button";
              remove(productId);
            } else setQuantity(productId, qty - 1);
          }}
        >
          {qty === 1 ? <TrashIcon width={compact ? 15 : 17} height={compact ? 15 : 17} /> : <MinusIcon />}
        </button>
        <span className={`min-w-6 text-center font-semibold tabular-nums ${compact ? "text-sm" : "text-base"}`} aria-live="polite" aria-atomic="true">
          {qty}
          <span className="sr-only"> in cart</span>
        </span>
        <button
          ref={plusRef}
          type="button"
          className={btn}
          aria-label={`Increase quantity of ${name}`}
          title={atMax ? (stock != null && stock <= maxQty ? `Only ${max} in stock` : `Up to ${maxQty} per order`) : undefined}
          disabled={atMax}
          onClick={() => setQuantity(productId, qty + 1)}
        >
          <PlusIcon />
        </button>
      </div>
    );
  }

  const label = disabled ? (compact ? "Sold out" : "Out of stock") : compact ? "Add" : "Add to Cart";
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        focusNext.current = "stepper";
        add(productId, 1);
      }}
      disabled={disabled}
      aria-label={disabled ? `${name} is out of stock` : `Add ${name} to cart`}
      className={`btn-primary ${className} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
    >
      <BagIcon width={compact ? 16 : 18} height={compact ? 16 : 18} /> {label}
    </button>
  );
}
