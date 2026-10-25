import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { int, mapProduct } from "@/lib/server/model";

export const dynamic = "force-dynamic";

/** Adds units to a product's stock and records it in the stock log. */
export const POST = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req);
  const qty = int((await readJson(req)).qty, "Units to add", 1, 100_000);
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: p, error } = await client.from("products").select("id, name, stock").eq("id", params.id).maybeSingle();
    if (error) throw dbError(error);
    if (!p) throw new HttpError(404, "That product no longer exists.");
    // Compare-and-set so two simultaneous additions can't overwrite each other.
    const { data, error: upErr } = await client
      .from("products")
      .update({ stock: p.stock + qty })
      .eq("id", p.id)
      .eq("stock", p.stock)
      .select("*");
    if (upErr) throw dbError(upErr);
    if (data && data.length) {
      await client.from("stock_log").insert({ text: `Stock added · ${p.name}`, delta: qty, product_id: p.id });
      return json({ product: mapProduct(data[0]) });
    }
  }
  throw new HttpError(409, "Stock changed while saving. Please try again.");
});
