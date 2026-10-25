import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** Marks New orders as Packed (and logs it on each order's timeline). */
export const POST = handle(async (req) => {
  const { client } = await requireAdmin(req);
  const numbers = (await readJson<{ numbers?: unknown }>(req)).numbers;
  if (!Array.isArray(numbers) || !numbers.length || numbers.length > 200 || !numbers.every((n) => Number.isInteger(n) && n > 0)) {
    throw new HttpError(400, "Choose between 1 and 200 orders.");
  }
  const { data, error } = await client.from("orders").update({ status: "Packed" }).in("number", numbers as number[]).eq("status", "New").select("number");
  if (error) throw dbError(error);
  const packed = (data ?? []).map((r) => r.number as number);
  if (packed.length) {
    const { error: evErr } = await client
      .from("order_events")
      .insert(packed.map((n) => ({ order_number: n, label: "Packed", note: "Barcode scanned" })));
    if (evErr) throw dbError(evErr);
  }
  return json({ packed: packed.length, skipped: numbers.length - packed.length });
});
