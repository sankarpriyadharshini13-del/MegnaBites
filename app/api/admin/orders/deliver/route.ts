import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { EMAIL_ORDER_COLUMNS, notifyDelivered } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

/** Marks Packed orders as Delivered, logs it on the timeline and emails each customer. */
export const POST = handle(async (req) => {
  const { client } = await requireAdmin(req);
  const numbers = (await readJson<{ numbers?: unknown }>(req)).numbers;
  if (!Array.isArray(numbers) || !numbers.length || numbers.length > 200 || !numbers.every((n) => Number.isInteger(n) && n > 0)) {
    throw new HttpError(400, "Choose between 1 and 200 orders.");
  }
  const { data, error } = await client
    .from("orders")
    .update({ status: "Delivered", delivered_at: new Date().toISOString() })
    .in("number", numbers as number[])
    .eq("status", "Packed")
    .select(EMAIL_ORDER_COLUMNS);
  if (error) throw dbError(error);
  const rows = data ?? [];
  if (rows.length) {
    const { error: evErr } = await client
      .from("order_events")
      .insert(rows.map((r) => ({ order_number: r.number, label: "Delivered", note: "Delivery confirmation emailed" })));
    if (evErr) throw dbError(evErr);
    await notifyDelivered(client, rows);
  }
  return json({ delivered: rows.length, skipped: numbers.length - rows.length });
});
