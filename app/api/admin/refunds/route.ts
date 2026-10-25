import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { int, str } from "@/lib/server/model";

export const dynamic = "force-dynamic";

/** Records a refund against an order (full or partial). The payment-gateway call itself isn't made here. */
export const POST = handle(async (req) => {
  const { client } = await requireAdmin(req);
  const body = await readJson(req);
  const orderNumber = int(body.orderNumber, "Order", 1, Number.MAX_SAFE_INTEGER);
  const amount = int(body.amount, "Refund amount", 1, 10_000_000);
  const reason = str(body.reason, "Reason", 200, { required: true });
  const note = str(body.note, "Note", 500);

  const { data: o, error } = await client
    .from("orders")
    .select("number, shipping, payment_status, payment_refunded, order_items(price, qty)")
    .eq("number", orderNumber)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!o) throw new HttpError(404, "That order no longer exists.");
  if (o.payment_status === "pending") throw new HttpError(409, "This payment is still pending — there is nothing to refund yet.");
  const total = (o.order_items as { price: number; qty: number }[]).reduce((s, i) => s + i.price * i.qty, 0) + o.shipping;
  const max = total - o.payment_refunded;
  if (max <= 0) throw new HttpError(409, "This order has already been refunded in full.");
  if (amount > max) throw new HttpError(400, `You can refund at most ₹${max} on this order.`);

  const refunded = o.payment_refunded + amount;
  // Compare-and-set on the previous refunded amount so a double click can't refund twice.
  const { data: upd, error: upErr } = await client
    .from("orders")
    .update({ payment_refunded: refunded, payment_status: refunded >= total ? "refunded" : "partial_refund" })
    .eq("number", orderNumber)
    .eq("payment_refunded", o.payment_refunded)
    .select("number");
  if (upErr) throw dbError(upErr);
  if (!upd?.length) throw new HttpError(409, "This order was just refunded by someone else. Refresh and check.");

  const { error: rErr } = await client.from("refunds").insert({ order_number: orderNumber, amount, reason, note });
  if (rErr) {
    await client.from("orders").update({ payment_refunded: o.payment_refunded, payment_status: o.payment_status }).eq("number", orderNumber);
    throw dbError(rErr);
  }
  await client.from("order_events").insert({ order_number: orderNumber, label: "Refund issued", note: `₹${amount} · ${reason}` });
  return json({ ok: true, amount }, 201);
});
