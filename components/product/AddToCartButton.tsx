"use client";

import { useCart } from "@/context/CartContext";
import { BagIcon } from "@/components/ui/Icons";

export default function AddToCartButton({
  productId,
  name,
  quantity = 1,
  className = "",
  disabled = false,
  compact = false,
}: {
  productId: string;
  name: string;
  quantity?: number;
  className?: string;
  disabled?: boolean;
  /** Short "Add" / "Sold out" label for tight layouts such as product cards. */
  compact?: boolean;
}) {
  const { add } = useCart();
  const label = disabled ? (compact ? "Sold out" : "Out of stock") : compact ? "Add" : "Add to Cart";
  return (
    <button type="button" onClick={() => add(productId, quantity)} disabled={disabled} aria-label={disabled ? `${name} is out of stock` : `Add ${name} to cart`} className={`btn-primary ${className} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}>
      <BagIcon width={compact ? 16 : 18} height={compact ? 16 : 18} /> {label}
    </button>
  );
}
