import { randomBytes } from "node:crypto";
import { orderLabel } from "@/lib/admin/format";
import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/guard";
import { loadSettings, notifyOrderPlaced } from "@/lib/server/orders";
import { DUMMY_GATEWAY, DUMMY_METHODS, paymentProvider } from "@/lib/server/payments";
import { serviceClient } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * Simulated payment (test mode only). Completes the signed-in customer's own pending checkout, saves
 * the order and sends the emails exactly as a real payment would — but no money is collected.
 * Disabled automatically once PAYMENT_PROVIDER=razorpay.
 */
export const POST = handle(async (req) => {
  if (paymentProvider !== "dummy") throw new HttpError(404, "Not found.");
  const { user } = await requireUser(req);
  const body = await readJson<{ orderId?: unknown; method?: unknown }>(req, 2000);
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const method = DUMMY_METHODS.find((m) => m === body.method);
  if (!orderId.startsWith("dummy_")) throw new HttpError(400, "Invalid checkout.");
  if (!method) throw new HttpError(400, "Choose a payment method.");

  const sb = serviceClient();
  const { data: pending, error } = await sb.from("pending_checkouts").select("user_id, created_at").eq("razorpay_order_id", orderId).maybeSingle();
  if (error) throw dbError(error);
  if (!pending) throw new HttpError(404, "This checkout has expired. Please start again from your cart.");
  if (pending.user_id !== user.id) throw new HttpError(403, "This checkout belongs to a different account.");

  const paymentId = `dummy_pay_${randomBytes(9).toString("base64url")}`;
  const { data: result, error: fErr } = await sb.rpc("finalize_checkout", {
    p_razorpay_order_id: orderId,
    p_payment_id: paymentId,
    p_method: method,
    p_gateway: DUMMY_GATEWAY,
  });
  if (fErr) throw dbError(fErr, "The order couldn't be saved. Please try again.");
  const r = result as { order_number: number; created: boolean };
  const orderNumber = Number(r.order_number);
  if (r.created) await notifyOrderPlaced(sb, orderNumber);

  const settings = await loadSettings(sb);
  return json({ orderNumber, label: orderLabel(orderNumber, settings.invoice.numberFormat) });
});
