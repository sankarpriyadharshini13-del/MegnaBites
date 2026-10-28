"use client";

import AddToCartButton from "@/components/product/AddToCartButton";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";
import { ArrowIcon } from "@/components/ui/Icons";

export default function AddToCartPanel({ productId, name, disabled = false }: { productId: string; name: string; disabled?: boolean }) {
  const { lines, hydrated } = useCart();
  const { open } = useUI();
  const inCart = hydrated && lines.some((l) => l.product.id === productId);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <AddToCartButton productId={productId} name={name} disabled={disabled} className="sm:min-w-56" />
      {inCart && (
        <button type="button" onClick={() => open("cart")} className="btn-secondary">
          View cart <ArrowIcon width={16} height={16} />
        </button>
      )}
    </div>
  );
}
