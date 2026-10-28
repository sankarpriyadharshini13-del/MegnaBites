"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowIcon, CheckIcon, LeafIcon } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useUI } from "@/context/UIContext";
import { formatInr } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import ReviewForm, { reviewLaterList, Stars, type SavedReview } from "@/components/reviews/ReviewForm";

interface MyOrder {
  number: number;
  label: string;
  placedAt: string;
  status: "New" | "Packed" | "Delivered" | "Cancelled";
  items: { productId: string | null; name: string; packSize: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  refunded: number;
  address: string;
  shipName: string;
  shipPhone: string;
  method: string;
  testPayment: boolean;
  deliveredAt: string | null;
  timeline: { label: string; note: string | null; at: string }[];
  review: SavedReview | null;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const STATUS: Record<MyOrder["status"], { label: string; cls: string }> = {
  New: { label: "Order placed", cls: "bg-honey/25 text-forest-deep" },
  Packed: { label: "Packed", cls: "bg-[#e3e9f8] text-[#3d5a99]" },
  Delivered: { label: "Delivered", cls: "bg-leaf/15 text-leaf" },
  Cancelled: { label: "Cancelled", cls: "bg-ink/10 text-ink/60" },
};

const STEPS: { key: MyOrder["status"]; label: string }[] = [
  { key: "New", label: "Placed" },
  { key: "Packed", label: "Packed" },
  { key: "Delivered", label: "Delivered" },
];

function Progress({ status }: { status: MyOrder["status"] }) {
  if (status === "Cancelled") return <p className="text-sm font-semibold text-ink/60">This order was cancelled.</p>;
  const reached = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i <= reached;
        return (
          <li key={s.key} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <span className="flex flex-col items-center gap-1.5">
              <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${done ? "bg-forest text-cream" : "border-2 border-forest/15 bg-white text-ink/40"}`}>
                {done ? <CheckIcon width={14} height={14} /> : i + 1}
              </span>
              <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${done ? "text-forest" : "text-ink/40"}`}>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden="true" className={`mx-2 mb-5 h-0.5 flex-1 rounded ${i < reached ? "bg-forest" : "bg-forest/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ o, defaultOpen, remind, onReviewed }: { o: MyOrder; defaultOpen: boolean; remind: boolean; onReviewed: (r: SavedReview) => void }) {
  const { getById } = useProducts();
  const [open, setOpen] = useState(defaultOpen);
  const [reviewing, setReviewing] = useState(false);
  const st = STATUS[o.status];
  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-soft ring-1 ring-forest/[0.06]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-forest/[0.07] p-5 sm:p-6">
        <div>
          <h2 className="font-display text-xl text-forest sm:text-2xl">Order #{o.label}</h2>
          <p className="mt-0.5 text-sm text-ink/55">Placed {fmtDate(o.placedAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} item{o.items.reduce((n, i) => n + i.qty, 0) === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${st.cls}`}>{st.label}</span>
          <span className="font-display text-xl text-forest">{formatInr(o.total)}</span>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <Progress status={o.status} />

        <ul className="divide-y divide-forest/[0.07]">
          {o.items.map((i, idx) => {
            const p = i.productId ? getById(i.productId) : undefined;
            return (
              <li key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="relative grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand">
                  {p?.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : <LeafIcon width={18} height={18} className="text-leaf/60" />}
                </span>
                <div className="min-w-0 flex-1">
                  {p ? (
                    <Link href={`/products/${p.slug}`} className="focus-ring rounded font-display text-base leading-tight text-forest hover:text-clay sm:text-lg">{i.name}</Link>
                  ) : (
                    <p className="font-display text-base leading-tight text-forest sm:text-lg">{i.name}</p>
                  )}
                  <p className="text-xs text-ink/55">{i.packSize ? `${i.packSize} · ` : ""}{i.qty} × {formatInr(i.price)}</p>
                </div>
                <span className="shrink-0 font-semibold text-forest">{formatInr(i.price * i.qty)}</span>
              </li>
            );
          })}
        </ul>

        {o.status !== "Cancelled" && (
          o.review ? (
            <div className="rounded-2xl bg-leaf/[0.07] p-4">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-forest">Your review <Stars value={o.review.rating} size={16} /></p>
              {o.review.message && <p className="mt-1.5 text-sm leading-relaxed text-ink/75">“{o.review.message}”</p>}
            </div>
          ) : reviewing ? (
            <div className="rounded-2xl bg-sand/50 p-4">
              <p className="mb-3 font-display text-lg text-forest">Rate this order</p>
              <ReviewForm
                orderNumber={o.number}
                mode="inline"
                onDone={(outcome, review) => {
                  setReviewing(false);
                  if (outcome === "submitted" && review) onReviewed(review);
                }}
              />
            </div>
          ) : (
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${remind ? "bg-honey/20 ring-1 ring-honey/50" : "bg-sand/40"}`}>
              <p className="text-sm text-ink/70">{remind ? "You saved this order to review later." : "Enjoyed your order? Let us know."}</p>
              <button type="button" className="btn-primary !min-h-10 !px-5 !text-sm" onClick={() => setReviewing(true)}>Rate this order</button>
            </div>
          )
        )}

        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-forest underline-offset-4 hover:text-clay hover:underline">
          {open ? "Hide details" : "View delivery & payment details"} <ArrowIcon width={14} height={14} className={`transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
        </button>

        {open && (
          <div className="grid gap-5 rounded-2xl bg-sand/40 p-4 text-sm sm:grid-cols-2 sm:p-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-clay">Delivery location</p>
              <p className="mt-1.5 leading-relaxed text-ink/80">
                {o.shipName && <b className="text-forest">{o.shipName}</b>}{o.shipPhone && <> · {o.shipPhone}</>}
                <br />
                {o.address || "—"}
              </p>
              {o.deliveredAt && <p className="mt-2 text-xs font-semibold text-leaf">Delivered on {fmtDate(o.deliveredAt)}</p>}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-clay">Payment</p>
              <div className="mt-1.5 space-y-1 text-ink/80">
                <p className="flex justify-between"><span>Items</span><span>{formatInr(o.subtotal)}</span></p>
                <p className="flex justify-between"><span>Delivery</span><span>{o.shipping ? formatInr(o.shipping) : "Free"}</span></p>
                <p className="flex justify-between font-semibold text-forest"><span>Total</span><span>{formatInr(o.total)}</span></p>
                {o.refunded > 0 && <p className="flex justify-between text-clay"><span>Refunded</span><span>{formatInr(o.refunded)}</span></p>}
                <p className="pt-1 text-xs text-ink/55">{o.testPayment ? `${o.method} · test payment (no money charged)` : `Paid via ${o.method}`}</p>
              </div>
            </div>
            {o.timeline.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-clay">Updates</p>
                <ol className="mt-2 space-y-2">
                  {o.timeline.map((e, i) => (
                    <li key={i} className="flex gap-3 text-ink/75">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest" aria-hidden="true" />
                      <span><b className="font-semibold text-forest">{e.label}</b> <span className="text-ink/50">· {fmtDateTime(e.at)}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function MyOrders() {
  const { user, ready, configured, isAdmin } = useAuth();
  const { open } = useUI();
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState("");
  const [later, setLater] = useState<number[]>([]);

  useEffect(() => setLater(reviewLaterList()), [orders]);

  const load = useCallback(async () => {
    const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
    if (!token) return;
    try {
      const res = await fetch("/api/orders/mine", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Your orders couldn't be loaded.");
      setError("");
      setOrders(body.orders ?? []);
    } catch {
      setError("Network problem. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    load();
    // Status changes (packed, delivered) show up when the customer comes back to the tab.
    const onFocus = () => document.visibilityState === "visible" && load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, load]);

  if (!ready) return <p className="text-ink/60" role="status">Loading…</p>;
  if (!configured) return <p className="text-ink/70">Login isn&apos;t set up yet.</p>;
  if (!user)
    return (
      <div className="max-w-md">
        <p className="text-lg text-ink/70">Sign in to see your orders.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => open("account")}>Sign in</button>
      </div>
    );
  if (isAdmin)
    return (
      <div className="max-w-lg rounded-[1.75rem] bg-sand/50 p-8">
        <p className="font-display text-xl text-forest">You&apos;re signed in as an admin</p>
        <p className="mt-2 text-ink/65">My orders is for customers. Every customer order is in the admin panel.</p>
        <Link href="/admin/orders" className="btn-primary mt-6">Open Admin → Orders</Link>
      </div>
    );
  if (error) return <p role="alert" className="rounded-2xl bg-sand p-4 text-ink/75">{error}</p>;
  if (!orders) return <p className="text-ink/60" role="status">Loading your orders…</p>;
  if (!orders.length)
    return (
      <div className="rounded-[1.75rem] bg-sand/50 p-8 text-center sm:p-12">
        <p className="font-display text-2xl text-forest">No orders yet</p>
        <p className="mt-2 text-ink/65">When you place an order, it will appear here with its items and delivery status.</p>
        <Link href="/shop" className="btn-primary mt-6">Shop our products</Link>
      </div>
    );
  const waiting = orders.filter((o) => !o.review && o.status !== "Cancelled" && later.includes(o.number));
  return (
    <div className="space-y-5">
      {waiting.length > 0 && (
        <p role="status" className="rounded-2xl bg-honey/20 p-4 text-sm text-forest-deep ring-1 ring-honey/50">
          ⭐ You have {waiting.length} order{waiting.length === 1 ? "" : "s"} waiting for your review — use “Rate this order” below.
        </p>
      )}
      {orders.map((o, i) => (
        <OrderCard
          key={o.number}
          o={o}
          defaultOpen={i === 0}
          remind={later.includes(o.number)}
          onReviewed={(review) => setOrders((list) => (list ?? []).map((x) => (x.number === o.number ? { ...x, review } : x)))}
        />
      ))}
    </div>
  );
}
