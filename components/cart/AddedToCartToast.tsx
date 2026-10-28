"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";

/** Small confirmation after "Add to cart". The cart stays closed until the customer opens it. */
export default function AddedToCartToast() {
  const { lastAdded, count } = useCart();
  const { open, panel } = useUI();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [lastAdded]);

  if (!visible || !lastAdded || panel === "cart") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[55] flex justify-center px-4 sm:bottom-6">
      <div role="status" className="pointer-events-auto flex w-full max-w-md animate-fade-up items-center gap-3 rounded-2xl bg-forest px-4 py-3 text-cream shadow-lift">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream/15 text-honey"><CheckIcon width={16} height={16} /></span>
        <p className="min-w-0 flex-1 text-sm">
          <b className="font-semibold">{lastAdded.name}</b> added to cart
          <span className="block text-xs text-cream/60">{count} item{count === 1 ? "" : "s"} in your cart</span>
        </p>
        <button type="button" className="focus-ring shrink-0 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-forest hover:bg-honey" onClick={() => { setVisible(false); open("cart"); }}>
          View cart
        </button>
        <button type="button" aria-label="Dismiss" className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full text-cream/70 hover:text-cream" onClick={() => setVisible(false)}>
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
