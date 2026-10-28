import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http";

const keyId = process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

export const razorpayConfigured = Boolean(keyId && keySecret);
export const razorpayKeyId = keyId;

const API = "https://api.razorpay.com/v1";
const auth = () => `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!razorpayConfigured) throw new HttpError(503, "Online payment isn't set up yet.", "payments_not_configured");
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) {
    console.error("[razorpay]", res.status, json?.error?.description);
    throw new HttpError(502, "The payment gateway didn't respond as expected. Please try again.");
  }
  return json;
}

export interface RzpOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RzpPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
}

export const createOrder = (amountPaise: number, receipt: string, notes: Record<string, string>) =>
  call<RzpOrder>("/orders", { method: "POST", body: { amount: amountPaise, currency: "INR", receipt, notes } });

export const fetchPayment = (paymentId: string) => call<RzpPayment>(`/payments/${encodeURIComponent(paymentId)}`);

export const capturePayment = (paymentId: string, amountPaise: number) =>
  call<RzpPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, { method: "POST", body: { amount: amountPaise, currency: "INR" } });

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Checkout callback signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export const webhookConfigured = Boolean(webhookSecret);

/** Razorpay method names → the values the admin panel shows. */
export function mapMethod(method: string) {
  switch (method) {
    case "upi": return "UPI";
    case "card": return "Card";
    case "netbanking": return "NetBanking";
    case "wallet": return "Wallet";
    default: return "Other";
  }
}
