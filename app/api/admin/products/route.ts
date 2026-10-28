import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { mapProduct, nextBarcode, parseProduct, skuFor, slugify } from "@/lib/server/model";
import { PRODUCT_COLORS } from "@/lib/admin/defaults";

export const dynamic = "force-dynamic";

/** Create (no id) or update (with id) a product. Validated here, saved to the database. */
export const POST = handle(async (req) => {
  const { client } = await requireAdmin(req);
  const input = parseProduct(await readJson(req));

  let existing: Record<string, unknown> | null = null;
  if (input.id) {
    const { data, error } = await client.from("products").select("*").eq("id", input.id).maybeSingle();
    if (error) throw dbError(error);
    if (!data) throw new HttpError(404, "That product no longer exists.");
    existing = data;
  }

  const { data: all, error: allErr } = await client.from("products").select("id, barcode");
  if (allErr) throw dbError(allErr);
  const known = (all ?? []) as { id: string; barcode: string | null }[];

  let id = input.id;
  if (!id) {
    const base = slugify(input.name);
    const taken = new Set(known.map((p) => p.id));
    id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  }

  const row: Record<string, unknown> = {
    id,
    name: input.name,
    sku: skuFor(input.name, input.packSize, (existing?.sku as string) ?? ""),
    price: input.price,
    original_price: input.originalPrice,
    stock: input.stock,
    pack_size: input.packSize,
    tag: input.tag,
    description: input.description,
    visible: input.visible,
    images: input.images,
  };

  let saved: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    const barcode = (existing?.barcode as string | null) || nextBarcode(known.map((p) => p.barcode));
    const q = existing
      ? client
          .from("products")
          .update({
            ...row,
            barcode,
            // The storefront page falls back to `description` once the original long text is superseded.
            long_description: existing.description === input.description ? existing.long_description : "",
          })
          .eq("id", id)
      : client.from("products").insert({ ...row, barcode, color: PRODUCT_COLORS[known.length % PRODUCT_COLORS.length] });
    const { data, error } = await q.select("*").single();
    if (!error) {
      saved = data;
      break;
    }
    // Before the original-price migration is applied, products without one still save normally.
    if (["PGRST204", "42703"].includes(error.code ?? "") && "original_price" in row) {
      if (input.originalPrice != null)
        throw new HttpError(503, "To save an original price, run supabase/migrations/20261029000000_original_price.sql in the Supabase SQL Editor first.", "SCHEMA_MISSING");
      delete row.original_price;
      attempt--;
      continue;
    }
    // Two admins creating products at the same moment can race for a barcode; try the next one.
    if (error.code === "23505" && !existing && attempt < 2) {
      known.push({ id: "", barcode });
      continue;
    }
    throw dbError(error);
  }
  if (!saved) throw new HttpError(500, "The product couldn't be saved.");

  const before = (existing?.stock as number | undefined) ?? 0;
  if ((saved.stock as number) !== before) {
    await client.from("stock_log").insert({
      text: `${existing ? "Stock adjusted" : "Opening stock"} · ${saved.name}`,
      delta: (saved.stock as number) - before,
      product_id: saved.id,
    });
  }
  return json({ product: mapProduct(saved) }, existing ? 200 : 201);
});
