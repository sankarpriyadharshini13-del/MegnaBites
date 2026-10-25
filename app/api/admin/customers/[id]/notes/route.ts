import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { str } from "@/lib/server/model";

export const dynamic = "force-dynamic";

export const POST = handle<{ params: { id: string } }>(async (req, { params }) => {
  const { client } = await requireAdmin(req);
  const text = str((await readJson(req)).text, "Note", 1000, { required: true });
  const { data: c, error } = await client.from("customers").select("id").eq("id", params.id).maybeSingle();
  if (error) throw dbError(error);
  if (!c) throw new HttpError(404, "That customer no longer exists.");
  const { error: nErr } = await client.from("customer_notes").insert({ customer_id: params.id, text });
  if (nErr) throw dbError(nErr);
  return json({ ok: true }, 201);
});
