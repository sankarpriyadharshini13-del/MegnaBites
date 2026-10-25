import { dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { parseSettings } from "@/lib/server/model";

export const dynamic = "force-dynamic";

export const PUT = handle(async (req) => {
  const { client } = await requireAdmin(req);
  const settings = parseSettings(await readJson(req));
  const { error } = await client.from("app_settings").upsert({ id: 1, data: settings });
  if (error) throw dbError(error);
  return json({ settings });
});
