import { orderLabel } from "@/lib/admin/format";
import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/guard";
import { loadSettings, notifyOrderPlaced } from "@/lib/server/orders";
import { paymentProvider } from "@/lib/server/payments";
import { capturePayment, fetchPayment, mapMethod, verifyPaymentSignature } from "@/lib/server/razorpay";
import { serviceClient } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * Step 2 of checkout (Razorpay's success callback): verify the signature, confirm the payment with
 * Razorpay itself, then save the order and send the emails.
 */
export const POST = handle(async (req) => {
  if (paymentProvider !== "razorpay") throw new HttpError(404, "Not found.");
  const { user } = await requireUser(req);
  const body = await readJson<Record<string, unknown>>(req, 4000);
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature) throw new HttpError(400, "Missing payment details.");
  if (!verifyPaymentSignature(orderId, paymentId, signature)) throw new HttpError(400, "The payment couldn't be verified.");

  const sb = serviceClient();
  const { data: pending, error } = await sb.from("pending_checkouts").select("user_id, amount, order_number").eq("razorpay_order_id", orderId).maybeSingle();
  if (error) throw dbError(error);
  if (!pending) throw new HttpError(404, "We couldn't find this checkout. If you were charged, contact us with your payment ID.");
  if (pending.user_id !== user.id) throw new HttpError(403, "This payment belongs to a different account.");

  let payment = await fetchPayment(paymentId);
  if (payment.order_id !== orderId || payment.amount !== pending.amount * 100 || payment.currency !== "INR") {
    throw new HttpError(400, "The payment doesn't match this order. Contact us with your payment ID.");
  }
  if (payment.status === "authorized") payment = await capturePayment(paymentId, payment.amount);
  if (payment.status !== "captured") throw new HttpError(402, "The payment hasn't completed. You haven't been charged for this order.");

  const { data: result, error: fErr } = await sb.rpc("finalize_checkout", {
    p_razorpay_order_id: orderId,
    p_payment_id: paymentId,
    p_method: mapMethod(payment.method),
    p_gateway: "Razorpay",
  });
  if (fErr) throw dbError(fErr, "Your payment went through but the order couldn't be saved. Contact us with your payment ID.");
  const orderNumber = Number((result as { order_number: number }).order_number);
  if ((result as { created: boolean }).created) await notifyOrderPlaced(sb, orderNumber);

  const settings = await loadSettings(sb);
  return json({ orderNumber, label: orderLabel(orderNumber, settings.invoice.numberFormat) });
});
