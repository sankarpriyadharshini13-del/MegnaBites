"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";

/**
 * Small notice at the bottom of the page: "Added to cart" after an add, or the stock-limit message when the
 * customer tries to go past what's available. The cart stays closed until the customer opens it.
 * (Inside the open cart the limit message is shown next to the item instead.)
 */
export default function AddedToCartToast() {
  const { lastAdded, limitNotice, dismissLimit, count } = useCart();
  const { open, panel } = useUI();
  const [visible, setVisible] = useState<"added" | "limit" | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    // An add that hit the limit is reported by the limit message instead.
    if (limitNotice && limitNotice.at >= lastAdded.at) return;
    setVisible("added");
    const t = setTimeout(() => setVisible(null), 3500);
    return () => clearTimeout(t);
  }, [lastAdded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!limitNotice) return setVisible((v) => (v === "limit" ? null : v));
    setVisible("limit");
    const t = setTimeout(() => setVisible(null), 8000);
    return () => clearTimeout(t);
  }, [limitNotice]);

  if (!visible || panel === "cart") return null;

  if (visible === "limit" && limitNotice) {
    const close = () => { setVisible(null); dismissLimit(); };
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[55] flex justify-center px-4 sm:bottom-6">
        <div role="alert" className="pointer-events-auto flex w-full max-w-md animate-fade-up items-start gap-3 rounded-2xl bg-forest px-4 py-3 text-cream shadow-lift">
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-honey font-display text-base font-bold text-forest-deep">!</span>
          <div className="min-w-0 flex-1 text-sm">
            <b className="font-semibold">{limitNotice.name}</b>
            <p className="mt-0.5 leading-relaxed text-cream/85">{limitNotice.message}</p>
            <Link href="/#contact" onClick={close} className="focus-ring mt-2 inline-flex rounded-full bg-cream px-4 py-1.5 text-sm font-semibold text-forest hover:bg-honey">
              Contact our shop
            </Link>
          </div>
          <button type="button" aria-label="Dismiss" className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full text-cream/70 hover:text-cream" onClick={close}>
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      </div>
    );
  }

  if (visible !== "added" || !lastAdded) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[55] flex justify-center px-4 sm:bottom-6">
      <div role="status" className="pointer-events-auto flex w-full max-w-md animate-fade-up items-center gap-3 rounded-2xl bg-forest px-4 py-3 text-cream shadow-lift">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream/15 text-honey"><CheckIcon width={16} height={16} /></span>
        <p className="min-w-0 flex-1 text-sm">
          <b className="font-semibold">{lastAdded.name}</b> added to cart
          <span className="block text-xs text-cream/60">{count} item{count === 1 ? "" : "s"} in your cart</span>
        </p>
        <button type="button" className="focus-ring shrink-0 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-forest hover:bg-honey" onClick={() => { setVisible(null); open("cart"); }}>
          View cart
        </button>
        <button type="button" aria-label="Dismiss" className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full text-cream/70 hover:text-cream" onClick={() => setVisible(null)}>
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
