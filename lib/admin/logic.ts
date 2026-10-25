import { addWorkingDays, startOfDay } from "./format";
import type { AdminData, AdminProduct, Customer, Order, OrderStatus, PaymentStatus } from "./types";

export const LOW_STOCK = 10;
export const FEE_RATE = 0.02;

export const orderSubtotal = (o: Order) => o.items.reduce((s, i) => s + i.price * i.qty, 0);
export const orderTotal = (o: Order) => orderSubtotal(o) + o.shipping;
export const orderUnits = (o: Order) => o.items.reduce((s, i) => s + i.qty, 0);

export type Tone = "green" | "yellow" | "blue" | "orange" | "red" | "gray";

export function orderTone(s: OrderStatus): Tone {
  switch (s) {
    case "New": return "yellow";
    case "Packed": return "green";
    default: return "gray";
  }
}

export function productStatus(p: AdminProduct): { label: string; tone: Tone } {
  if (!p.visible) return { label: "Draft", tone: "blue" };
  if (p.stock <= 0) return { label: "Out of stock", tone: "red" };
  if (p.stock <= LOW_STOCK) return { label: "Active · low stock", tone: "yellow" };
  return { label: "Active", tone: "green" };
}

export interface PaymentView {
  label: string;
  tone: Tone;
  amount: number;
  fee: number;
  /** Date the money reaches the bank; null while the payment is still pending. */
  payout: Date | null;
  settled: boolean;
  /** Counts towards money already collected. */
  collected: boolean;
}

const PAY_LABEL: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "yellow" },
  captured: { label: "Captured", tone: "blue" },
  refunded: { label: "Refunded", tone: "gray" },
  partial_refund: { label: "Partial refund", tone: "orange" },
};

export function paymentView(o: Order, now: Date): PaymentView {
  const amount = orderTotal(o);
  const fee = Math.round(amount * FEE_RATE);
  const pending = o.payment.status === "pending";
  const payout = pending ? null : addWorkingDays(new Date(o.placedAt), 2);
  const settled = !!payout && payout < startOfDay(now);
  let { label, tone } = PAY_LABEL[o.payment.status];
  if (o.payment.status === "captured" && settled) {
    label = "Settled";
    tone = "green";
  }
  return { label, tone, amount, fee, payout, settled, collected: !pending };
}

export interface CustomerStat {
  orders: number;
  spent: number;
  last: string | null;
  tag: "VIP" | "Repeat" | "New";
}

export function customerStats(data: AdminData): Map<string, CustomerStat> {
  const map = new Map<string, CustomerStat>();
  for (const c of data.customers) map.set(c.id, { orders: 0, spent: 0, last: null, tag: "New" });
  for (const o of data.orders) {
    const s = map.get(o.customerId);
    if (!s) continue;
    s.orders += 1;
    if (o.status !== "Cancelled") s.spent += orderTotal(o) - o.payment.refunded;
    if (!s.last || o.placedAt > s.last) s.last = o.placedAt;
  }
  for (const s of map.values()) s.tag = s.orders >= 6 ? "VIP" : s.orders >= 2 ? "Repeat" : "New";
  return map;
}

export const customerCity = (c: Customer) => (c.city === "Chennai" && c.area ? `${c.area}, Chennai` : c.city);

/** Short location line; falls back to the email for accounts that signed up but never ordered. */
export const customerSub = (c: Customer) => c.area || c.city || c.email;

/** Orders waiting to be packed (shown as the sidebar badge). */
export const attentionCount = (orders: Order[]) => orders.filter((o) => o.status === "New").length;

export const refundable = (o: Order) => orderTotal(o) - o.payment.refunded;

/** 12-digit barcodes step by 7 from the highest existing one (preview only — the server assigns it). */
export function nextBarcode(products: { barcode: string }[]) {
  const nums = products.map((p) => Number(p.barcode)).filter((n) => Number.isFinite(n) && n > 0);
  return String((nums.length ? Math.max(...nums) : 890123450010) + 7);
}
