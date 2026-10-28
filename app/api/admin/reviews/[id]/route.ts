import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** "Live on website" switch: only published reviews are shown on the home page. */
export const PUT = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req);
  const body = await readJson(req);
  if (typeof body.published !== "boolean") throw new HttpError(400, "Live on website must be on or off.");
  const { data, error } = await client
    .from("reviews")
    .update({ published: body.published, published_at: body.published ? new Date().toISOString() : null })
    .eq("id", params.id)
    .select("id, published");
  if (error) {
    if (["42703", "PGRST204"].includes(error.code ?? ""))
      throw new HttpError(503, "To show reviews on the website, run supabase/migrations/20261030000000_review_publishing.sql in the Supabase SQL Editor first.", "SCHEMA_MISSING");
    throw dbError(error);
  }
  if (!data?.length) throw new HttpError(404, "That review no longer exists.");
  return json({ ok: true, published: data[0].published });
});

/** Admins can remove a review (e.g. spam or a duplicate). */
export const DELETE = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req);
  const { data, error } = await client.from("reviews").delete().eq("id", params.id).select("id");
  if (error) throw dbError(error);
  if (!data?.length) throw new HttpError(404, "That review no longer exists.");
  return json({ ok: true });
});
