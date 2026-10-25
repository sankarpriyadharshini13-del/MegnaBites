import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { anonClient, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** Public: is this invitation token currently valid? Reveals only a masked email. */
export const POST = handle(async (req) => {
  if (!supabaseConfigured) throw new HttpError(503, "Supabase isn't configured on the server.");
  const token = (await readJson<{ token?: unknown }>(req, 2000)).token;
  if (typeof token !== "string" || token.length < 10 || token.length > 200) return json({ valid: false, reason: "not_found" });
  const { data, error } = await anonClient().rpc("check_invite", { p_token: token });
  if (error) throw dbError(error);
  return json(data);
});
