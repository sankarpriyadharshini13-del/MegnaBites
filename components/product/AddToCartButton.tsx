"use client";

import { useCart } from "@/context/CartContext";
import { BagIcon } from "@/components/ui/Icons";

export default function AddToCartButton({ productId, name, quantity = 1, className = "" }: { productId: string; name: string; quantity?: number; className?: string }) {
  const { add } = useCart();
  return (
    <button type="button" onClick={() => add(productId, quantity)} aria-label={`Add ${name} to cart`} className={`btn-primary ${className}`}>
      <BagIcon width={18} height={18} /> Add to Cart
    </button>
  );
}
