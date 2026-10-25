import { HttpError, dbError, handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** Owner only: removes an invited admin's access. The owner row can't be removed. */
export const DELETE = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req, { owner: true });
  const { data, error } = await client.from("admin_members").delete().eq("user_id", params.id).eq("role", "admin").select("user_id");
  if (error) throw dbError(error);
  if (!data?.length) throw new HttpError(404, "That team member doesn't exist.");
  return json({ ok: true });
});
