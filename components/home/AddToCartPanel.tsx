"use client";

import { useState } from "react";
import QuantityControl from "@/components/ui/QuantityControl";
import AddToCartButton from "@/components/product/AddToCartButton";

export default function AddToCartPanel({ productId, name, disabled = false }: { productId: string; name: string; disabled?: boolean }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <QuantityControl value={qty} onChange={setQty} label={name} />
      <AddToCartButton productId={productId} name={name} quantity={qty} disabled={disabled} className="sm:min-w-56" />
    </div>
  );
}
