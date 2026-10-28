import { HttpError, dbError, handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** Admins can remove a review (e.g. spam or a duplicate). */
export const DELETE = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req);
  const { data, error } = await client.from("reviews").delete().eq("id", params.id).select("id");
  if (error) throw dbError(error);
  if (!data?.length) throw new HttpError(404, "That review no longer exists.");
  return json({ ok: true });
});
