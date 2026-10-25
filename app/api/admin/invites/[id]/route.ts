import { HttpError, dbError, handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export const DELETE = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req, { owner: true });
  const { data, error } = await client
    .from("admin_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", params.id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id");
  if (error) throw dbError(error);
  if (!data?.length) throw new HttpError(404, "That invitation can't be revoked (already used or revoked).");
  return json({ ok: true });
});
