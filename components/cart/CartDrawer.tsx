"use client";

import Link from "next/link";
import Image from "next/image";
import Dialog from "@/components/ui/Dialog";
import QuantityControl from "@/components/ui/QuantityControl";
import Price from "@/components/ui/Price";
import { TrashIcon, BagIcon } from "@/components/ui/Icons";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { startCheckout } from "@/services/checkout";
import { formatInr } from "@/lib/format";

export default function CartDrawer() {
  const { panel, close } = useUI();
  const { lines, count, subtotal, hasUnpriced, setQuantity, remove, maxQty } = useCart();
  const { user } = useAuth();

  const footer = lines.length ? (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">Subtotal</span>
        <span className="font-display text-2xl text-forest" data-testid="subtotal">{subtotal > 0 ? formatInr(subtotal) : "—"}</span>
      </div>
      {hasUnpriced && (
        <p className="mt-1 text-xs text-ink/55">
          {subtotal > 0 ? "Excludes items whose price is yet to be confirmed. " : "Prices are being finalised. "}
          We&apos;ll confirm the total when you place your order.
        </p>
      )}
      <button type="button" className="btn-primary mt-4 w-full" onClick={() => startCheckout(lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })), user)}>
        Place order by email
      </button>
      <p className="mt-2 text-center text-xs text-ink/50">Online payment is coming soon. This opens a pre-filled order email.</p>
    </div>
  ) : null;

  return (
    <Dialog open={panel === "cart"} onClose={close} variant="drawer" title={`Your cart${count ? ` (${count})` : ""}`} footer={footer}>
      {lines.length === 0 ? (
        <div className="grid place-items-center py-12 text-center sm:py-16">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-sand text-forest sm:h-16 sm:w-16"><BagIcon width={24} height={24} className="sm:w-7 sm:h-7" /></span>
          <p className="mt-4 font-display text-lg text-forest sm:text-xl">Your cart is empty</p>
          <p className="mt-1 text-sm text-ink/60">A little tradition is waiting for you.</p>
          <Link href="/shop" onClick={close} className="btn-primary mt-5 text-sm sm:mt-6 sm:text-[15px]">Shop our products</Link>
        </div>
      ) : (
        <ul className="divide-y divide-leaf/10">
          {lines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="flex gap-3 py-4 first:pt-0 sm:gap-4 sm:py-5">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-24 sm:w-20 sm:rounded-2xl">
                {product.image ? (
                  <Image src={product.image} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center px-1 text-center font-display text-xs text-forest/70">{product.name}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${product.slug}`} onClick={close} className="focus-ring rounded font-display text-base leading-tight text-forest hover:text-clay sm:text-lg">{product.name}</Link>
                  <button type="button" onClick={() => remove(product.id)} aria-label={`Remove ${product.name} from cart`} className="icon-btn -mr-2 -mt-1 h-9 w-9 text-ink/50 hover:text-clay">
                    <TrashIcon />
                  </button>
                </div>
                <p className="text-[11px] text-ink/50 sm:text-xs">{product.packSize ?? "Pack size to be confirmed"}</p>
                <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-3">
                  <QuantityControl value={quantity} max={maxQty} label={product.name} onChange={(n) => setQuantity(product.id, n)} />
                  {lineTotal != null ? <Price amount={lineTotal} className="!text-base sm:!text-lg" /> : <Price amount={null} className="!text-xs" />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
