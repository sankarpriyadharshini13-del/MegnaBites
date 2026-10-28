"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Dialog from "@/components/ui/Dialog";
import { CheckIcon } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";
import { useUI } from "@/context/UIContext";
import { formatInr } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { startCheckout } from "@/services/checkout";
import ReviewForm from "@/components/reviews/ReviewForm";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

const RESUME_KEY = "magna-resume-checkout";
const addressKey = (userId: string) => `magna-delivery-${userId}`;

interface Delivery {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function authed(path: string, body: unknown) {
  const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

type Stage = "form" | "paying" | "dummy" | "verifying" | "done";
type DummyMethod = "UPI" | "Card" | "NetBanking";

const DUMMY_METHODS: { id: DummyMethod; label: string; hint: string }[] = [
  { id: "UPI", label: "UPI", hint: "Any UPI app — simulated" },
  { id: "Card", label: "Credit / debit card", hint: "No card details needed — simulated" },
  { id: "NetBanking", label: "Netbanking", hint: "Any bank — simulated" },
];

export default function CheckoutDialog() {
  const { panel, open, close } = useUI();
  const { user, ready, configured } = useAuth();
  const { lines, subtotal, hasUnpriced, clear } = useCart();
  const { getById, refresh } = useProducts();
  const isOpen = panel === "checkout";

  const [d, setD] = useState<Delivery>({ name: "", phone: "", address: "", city: "", state: "Tamil Nadu", pincode: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Delivery, string>>>({});
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [provider, setProvider] = useState<"dummy" | "razorpay" | null>(null);
  const [dummyOrder, setDummyOrder] = useState<{ orderId: string; amount: number } | null>(null);
  const [dummyMethod, setDummyMethod] = useState<DummyMethod>("UPI");
  const [placed, setPlaced] = useState<{ number: number; label: string; email: string } | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<"submitted" | "later" | "skipped" | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  // Prefill from the account and the last delivery address used on this device.
  useEffect(() => {
    if (!user) return;
    let saved: Partial<Delivery> = {};
    try {
      saved = JSON.parse(localStorage.getItem(addressKey(user.id)) ?? "{}");
    } catch {
      /* ignore */
    }
    setD((cur) => ({
      name: cur.name || saved.name || user.name || "",
      phone: cur.phone || saved.phone || user.phone || "",
      address: cur.address || saved.address || "",
      city: cur.city || saved.city || "",
      state: saved.state || cur.state,
      pincode: cur.pincode || saved.pincode || "",
    }));
  }, [user]);

  // Came back from signing in: reopen checkout.
  useEffect(() => {
    if (!user) return;
    try {
      if (sessionStorage.getItem(RESUME_KEY)) {
        sessionStorage.removeItem(RESUME_KEY);
        open("checkout");
      }
    } catch {
      /* ignore */
    }
  }, [user, open]);

  useEffect(() => {
    if (isOpen && stage === "done" && !lines.length) return;
    if (isOpen) {
      setError("");
      if (stage !== "done") setStage("form");
      // Which payment step is active (test-mode simulation or Razorpay) and whether ordering is available.
      fetch("/api/checkout/config", { cache: "no-store" })
        .then((r) => r.json())
        .then((c) => {
          setProvider(c.provider === "razorpay" ? "razorpay" : "dummy");
          setUnavailable(!c.ready);
        })
        .catch(() => setProvider("dummy"));
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Delivery, v: string) => {
    setD((cur) => ({ ...cur, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!d.name.trim()) e.name = "Enter your name.";
    if (d.phone.replace(/\D/g, "").slice(-10).length !== 10) e.phone = "Enter a 10-digit mobile number.";
    if (d.address.trim().length < 5) e.address = "Enter your house / street address.";
    if (!d.city.trim()) e.city = "Enter your city.";
    if (!d.state) e.state = "Choose your state.";
    if (!/^[1-9]\d{5}$/.test(d.pincode.trim())) e.pincode = "Enter a 6-digit PIN code.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const pay = async () => {
    if (!user || !validate()) return;
    setError("");
    setStage("paying");
    try {
      localStorage.setItem(addressKey(user.id), JSON.stringify(d));
    } catch {
      /* ignore */
    }
    const created = await authed("/api/checkout/order", { ...d, items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })) });
    if (!created.ok) {
      setStage("form");
      if (created.json?.code === "payments_not_configured") setUnavailable(true);
      setError(created.json?.error ?? "We couldn't start the payment. Please try again.");
      refresh();
      return;
    }
    if (created.json.provider === "dummy") {
      setDummyOrder({ orderId: created.json.orderId, amount: created.json.amount / 100 });
      setStage("dummy");
      return;
    }
    if (!(await loadRazorpay())) {
      setStage("form");
      setError("The payment window couldn't load. Check your connection and try again.");
      return;
    }
    const o = created.json;
    const rzp = new window.Razorpay({
      key: o.keyId,
      order_id: o.orderId,
      amount: o.amount,
      currency: o.currency,
      name: o.storeName,
      description: `${lines.length} item${lines.length === 1 ? "" : "s"}`,
      image: o.logo ?? undefined,
      prefill: o.prefill,
      method: { ...o.methods, wallet: true },
      theme: { color: "#1B3D2A" },
      modal: { ondismiss: () => setStage((s) => (s === "paying" ? "form" : s)) },
      handler: async (resp: RazorpayResponse) => {
        setStage("verifying");
        const v = await authed("/api/checkout/verify", resp);
        if (!v.ok) {
          setStage("form");
          setError(v.json?.error ?? "We couldn't confirm the payment. If you were charged, contact us with your payment ID.");
          return;
        }
        clear();
        refresh();
        setPlaced({ number: v.json.orderNumber, label: v.json.label, email: user.email });
        setReviewOutcome(null);
        setStage("done");
      },
    });
    rzp.on("payment.failed", (r: { error?: { description?: string } }) => {
      setError(r.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. You haven't been charged.");
    });
    rzp.open();
  };

  /** Test mode: completes the order without any real payment (or simulates a failed payment). */
  const completeDummy = async (fail = false) => {
    if (!user || !dummyOrder) return;
    if (fail) {
      setStage("form");
      setDummyOrder(null);
      setError("Payment failed (simulated). You haven't been charged and no order was placed.");
      return;
    }
    setError("");
    setStage("verifying");
    const v = await authed("/api/checkout/dummy-pay", { orderId: dummyOrder.orderId, method: dummyMethod });
    if (!v.ok) {
      setStage("dummy");
      setError(v.json?.error ?? "The order couldn't be placed. Please try again.");
      return;
    }
    clear();
    refresh();
    setDummyOrder(null);
    setPlaced({ number: v.json.orderNumber, label: v.json.label, email: user.email });
        setReviewOutcome(null);
    setStage("done");
  };

  const busy = stage === "paying" || stage === "verifying";
  const field = (k: keyof Delivery) => `field ${errors[k] ? "!border-clay" : ""}`;

  const footer =
    stage === "done" || !user || !lines.length ? null : (
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">Total</span>
          <span className="font-display text-2xl text-forest">{formatInr(subtotal)}</span>
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-medium text-clay">{error}</p>}
        {(stage === "dummy" || (stage === "verifying" && dummyOrder)) && dummyOrder ? (
          <>
            <button type="button" className="btn-primary mt-4 w-full disabled:opacity-60" disabled={busy} onClick={() => completeDummy(false)}>
              {stage === "verifying" ? "Placing your order…" : `Pay ${formatInr(dummyOrder.amount)} (test)`}
            </button>
            <div className="mt-2 flex justify-center gap-4 text-xs">
              <button type="button" className="text-ink/55 underline underline-offset-2 hover:text-clay disabled:opacity-50" disabled={busy} onClick={() => completeDummy(true)}>Simulate a failed payment</button>
              <button type="button" className="text-ink/55 underline underline-offset-2 hover:text-clay disabled:opacity-50" disabled={busy} onClick={() => { setStage("form"); setDummyOrder(null); }}>Back to details</button>
            </div>
          </>
        ) : unavailable ? (
          <button type="button" className="btn-secondary mt-4 w-full" onClick={() => startCheckout(lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })), user, getById)}>
            Order by email instead
          </button>
        ) : (
          <button type="button" className="btn-primary mt-4 w-full disabled:opacity-60" disabled={busy || hasUnpriced} onClick={pay}>
            {stage === "verifying" ? "Confirming payment…" : stage === "paying" ? "Opening secure payment…" : `Pay ${formatInr(subtotal)} securely`}
          </button>
        )}
        <p className="mt-2 text-center text-xs text-ink/50">
          {provider === "razorpay" ? "Payments are processed by Razorpay — UPI, cards and netbanking." : "Test mode — payments are simulated and no money is charged."}
        </p>
      </div>
    );

  return (
    <Dialog open={isOpen} onClose={busy ? () => {} : close} variant="drawer" title={stage === "done" ? "Order confirmed" : "Checkout"} footer={footer} initialFocus={() => firstField.current}>
      {stage === "done" && placed ? (
        <div className="py-6">
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf/15 text-leaf"><CheckIcon width={26} height={26} /></span>
            <p className="mt-4 font-display text-2xl text-forest">Thank you!</p>
            <p className="mt-1 text-ink/70">Order <b>#{placed.label}</b> is confirmed.</p>
            <p className="mt-1 text-sm text-ink/60">A confirmation email is on its way to {placed.email}.</p>
          </div>

          {reviewOutcome === null ? (
            <section aria-labelledby="review-title" className="mt-7 rounded-2xl bg-sand/50 p-5">
              <h3 id="review-title" className="font-display text-xl text-forest">How was your shopping experience?</h3>
              <p className="mt-1 text-sm text-ink/60">Rate your order — it takes a few seconds and helps other customers.</p>
              <div className="mt-4">
                <ReviewForm orderNumber={placed.number} mode="prompt" onDone={(o) => setReviewOutcome(o === "cancelled" ? "skipped" : o)} />
              </div>
            </section>
          ) : (
            <p role="status" className="mt-7 rounded-2xl bg-sand/50 p-4 text-center text-sm text-ink/70">
              {reviewOutcome === "submitted"
                ? "Thanks for your review! 🌿"
                : reviewOutcome === "later"
                  ? "No problem — you can review this order any time from My orders."
                  : "Okay! You can still review it later from My orders."}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/orders" className="btn-primary" onClick={() => { setStage("form"); setPlaced(null); close(); }}>View my orders</Link>
            <button type="button" className="btn-secondary" onClick={() => { setStage("form"); setPlaced(null); close(); }}>Continue shopping</button>
          </div>
        </div>
      ) : !configured ? (
        <p className="rounded-2xl bg-sand p-4 text-sm text-ink/75">Online ordering isn&apos;t set up yet.</p>
      ) : !ready ? (
        <p className="text-ink/60">Loading…</p>
      ) : !user ? (
        <div className="py-6 text-center">
          <p className="font-display text-xl text-forest">Sign in to place your order</p>
          <p className="mt-2 text-sm text-ink/60">We&apos;ll use your account email for the order confirmation and delivery updates.</p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => {
              try {
                sessionStorage.setItem(RESUME_KEY, "1");
              } catch {
                /* ignore */
              }
              open("account");
            }}
          >
            Sign in or create account
          </button>
        </div>
      ) : !lines.length ? (
        <div className="py-8 text-center">
          <p className="font-display text-xl text-forest">Your cart is empty</p>
          <Link href="/shop" onClick={close} className="btn-primary mt-6">Shop our products</Link>
        </div>
      ) : (
        stage === "dummy" || (stage === "verifying" && dummyOrder) ? (
          <div className="space-y-5">
            <p className="rounded-2xl border border-honey/40 bg-honey/15 p-4 text-sm leading-relaxed text-forest-deep">
              <b>Test payment.</b> This is a simulated payment step — no money is charged. Your order is saved and emailed exactly like a real one.
            </p>
            <section aria-label="Paying for" className="rounded-2xl bg-sand/50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-ink/65">Amount</span><b className="text-forest">{dummyOrder && formatInr(dummyOrder.amount)}</b></div>
              <div className="mt-1 flex justify-between gap-3"><span className="text-ink/65">Deliver to</span><span className="text-right text-ink/80">{d.name}, {d.city} – {d.pincode}</span></div>
            </section>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-forest">Choose a payment method</legend>
              <div className="space-y-2.5">
                {DUMMY_METHODS.map((m) => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${dummyMethod === m.id ? "border-forest bg-white shadow-soft" : "border-leaf/15 bg-white/60 hover:border-forest/40"}`}>
                    <input type="radio" name="dummy-method" value={m.id} checked={dummyMethod === m.id} onChange={() => setDummyMethod(m.id)} className="h-4 w-4 accent-forest" />
                    <span>
                      <span className="block font-semibold text-forest">{m.label}</span>
                      <span className="block text-xs text-ink/55">{m.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
        <form onSubmit={(e) => { e.preventDefault(); pay(); }} noValidate className="space-y-5">
          <section aria-label="Order summary" className="rounded-2xl bg-sand/50 p-4">
            <ul className="space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-3">
                  <span className="text-ink/75">{l.product.name}{l.product.packSize ? ` ${l.product.packSize}` : ""} × {l.quantity}</span>
                  <span className="font-semibold text-forest">{l.lineTotal != null ? formatInr(l.lineTotal) : "Price TBC"}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-leaf/10 pt-2 text-ink/60"><span>Delivery</span><span>Free</span></li>
            </ul>
            {hasUnpriced && <p className="mt-2 text-xs font-medium text-clay">Remove items marked “Price TBC” to pay online.</p>}
          </section>

          <div>
            <label htmlFor="co-name" className="mb-1.5 block text-sm font-semibold text-forest">Full name</label>
            <input id="co-name" ref={firstField} className={field("name")} autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} />
            {errors.name && <p className="mt-1 text-xs text-clay">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="co-email" className="mb-1.5 block text-sm font-semibold text-forest">Email</label>
            <input id="co-email" className="field opacity-75" value={user.email} readOnly aria-describedby="co-email-hint" />
            <p id="co-email-hint" className="mt-1 text-xs text-ink/50">From your account — your confirmation and delivery emails go here.</p>
          </div>
          <div>
            <label htmlFor="co-phone" className="mb-1.5 block text-sm font-semibold text-forest">Mobile number</label>
            <input id="co-phone" className={field("phone")} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" value={d.phone} onChange={(e) => set("phone", e.target.value)} />
            {errors.phone && <p className="mt-1 text-xs text-clay">{errors.phone}</p>}
          </div>
          <fieldset className="space-y-4">
            <legend className="mb-1.5 text-sm font-semibold text-forest">Delivery location</legend>
            <div>
              <label htmlFor="co-address" className="sr-only">House / street address</label>
              <textarea id="co-address" rows={2} className={`${field("address")} resize-none`} autoComplete="street-address" placeholder="House no., street, area" value={d.address} onChange={(e) => set("address", e.target.value)} />
              {errors.address && <p className="mt-1 text-xs text-clay">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="co-city" className="mb-1 block text-xs font-semibold text-ink/60">City</label>
                <input id="co-city" className={field("city")} autoComplete="address-level2" value={d.city} onChange={(e) => set("city", e.target.value)} />
                {errors.city && <p className="mt-1 text-xs text-clay">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="co-pin" className="mb-1 block text-xs font-semibold text-ink/60">PIN code</label>
                <input id="co-pin" className={field("pincode")} inputMode="numeric" autoComplete="postal-code" maxLength={6} value={d.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
                {errors.pincode && <p className="mt-1 text-xs text-clay">{errors.pincode}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="co-state" className="mb-1 block text-xs font-semibold text-ink/60">State</label>
              <select id="co-state" className={field("state")} autoComplete="address-level1" value={d.state} onChange={(e) => set("state", e.target.value)}>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </fieldset>
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
        )
      )}
    </Dialog>
  );
}
