import { HttpError, dbError, handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { BUCKET, storagePrefix } from "@/lib/server/model";

export const dynamic = "force-dynamic";

export const DELETE = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req);
  const { data: product, error } = await client.from("products").select("id, name, images").eq("id", params.id).maybeSingle();
  if (error) throw dbError(error);
  if (!product) throw new HttpError(404, "That product no longer exists.");
  const { error: delErr } = await client.from("products").delete().eq("id", params.id);
  if (delErr) throw dbError(delErr);
  // Best effort: remove uploaded photos that belonged to this product.
  const prefix = storagePrefix();
  const paths = (product.images as string[]).filter((u) => u.startsWith(prefix)).map((u) => u.slice(prefix.length));
  if (paths.length) await client.storage.from(BUCKET).remove(paths);
  return json({ ok: true, name: product.name });
});
