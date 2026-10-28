import { handle, json } from "@/lib/server/http";
import { notifyOrderPlaced } from "@/lib/server/orders";
import { paymentProvider } from "@/lib/server/payments";
import { mapMethod, verifyWebhookSignature, webhookConfigured } from "@/lib/server/razorpay";
import { serviceClient, serviceConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook (payment.captured / order.paid). A safety net for customers who pay and close the tab
 * before the browser callback runs. finalize_checkout() is idempotent, so no order is created twice.
 * Configure in Razorpay Dashboard → Webhooks with RAZORPAY_WEBHOOK_SECRET.
 */
export const POST = handle(async (req) => {
  if (paymentProvider !== "razorpay" || !webhookConfigured || !serviceConfigured) return json({ error: "Webhook not configured" }, 503);
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) return json({ error: "Bad signature" }, 400);

  let event: { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string; amount: number; status: string; method: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Bad payload" }, 400);
  }
  if (event.event !== "payment.captured" && event.event !== "order.paid") return json({ ignored: event.event });
  const p = event.payload?.payment?.entity;
  if (!p?.order_id || p.status !== "captured") return json({ ignored: "not captured" });

  const sb = serviceClient();
  const { data: pending } = await sb.from("pending_checkouts").select("amount").eq("razorpay_order_id", p.order_id).maybeSingle();
  if (!pending) return json({ ignored: "unknown order" });
  if (pending.amount * 100 !== p.amount) {
    console.error("[webhook] amount mismatch for", p.order_id);
    return json({ ignored: "amount mismatch" });
  }
  const { data: result, error } = await sb.rpc("finalize_checkout", { p_razorpay_order_id: p.order_id, p_payment_id: p.id, p_method: mapMethod(p.method), p_gateway: "Razorpay" });
  if (error) {
    console.error("[webhook] finalize failed", error.message);
    return json({ error: "finalize failed" }, 500); // Razorpay retries
  }
  const r = result as { order_number: number; created: boolean };
  if (r.created) await notifyOrderPlaced(sb, Number(r.order_number));
  return json({ ok: true, orderNumber: r.order_number });
});
