import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, [number, string]> = {
  invalid_invite: [400, "This invitation is invalid, expired or has already been used."],
  invite_email_mismatch: [403, "This invitation was sent to a different email address. Sign in with the invited email."],
  email_not_confirmed: [403, "Confirm your email address first, then open the invitation link again."],
  not_signed_in: [401, "Please sign in first."],
};

/** Signed-in user redeems an invitation. All checks happen in the accept_invite() database function. */
export const POST = handle(async (req) => {
  const { client } = await requireUser(req);
  const token = (await readJson<{ token?: unknown }>(req, 2000)).token;
  if (typeof token !== "string" || token.length < 10 || token.length > 200) throw new HttpError(400, MESSAGES.invalid_invite[1]);
  const { error } = await client.rpc("accept_invite", { p_token: token });
  if (error) {
    const hit = Object.entries(MESSAGES).find(([k]) => error.message?.includes(k));
    if (hit) throw new HttpError(hit[1][0], hit[1][1]);
    throw dbError(error);
  }
  return json({ accepted: true });
});
