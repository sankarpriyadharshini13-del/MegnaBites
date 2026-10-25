import { createHash, randomBytes } from "node:crypto";
import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { mapInvite, str } from "@/lib/server/model";

export const dynamic = "force-dynamic";

/** Owner only: creates a single-use invitation link (valid 7 days). Only a hash of the token is stored. */
export const POST = handle(async (req) => {
  const owner = await requireAdmin(req, { owner: true });
  const body = await readJson(req);
  const email = str(body.email, "Email", 200, { required: true }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
  const name = str(body.name, "Name", 120) || null;
  const replace = body.replace === true;

  const { data: member, error: mErr } = await owner.client.from("admin_members").select("user_id").eq("email", email).maybeSingle();
  if (mErr) throw dbError(mErr);
  if (member) throw new HttpError(409, "That person already has admin access.");

  const { data: open, error: oErr } = await owner.client
    .from("admin_invites")
    .select("id")
    .eq("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());
  if (oErr) throw dbError(oErr);
  if (open?.length) {
    if (!replace) throw new HttpError(409, "There's already a pending invitation for that email. Use “New link” on it instead.");
    // "New link": the old link stops working as soon as the new one exists.
    const { error: rErr } = await owner.client
      .from("admin_invites")
      .update({ revoked_at: new Date().toISOString() })
      .in("id", open.map((o) => o.id as string));
    if (rErr) throw dbError(rErr);
  }

  const token = randomBytes(24).toString("base64url");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await owner.client.from("admin_invites").insert({ email, name, token_hash, created_by: owner.userId }).select("*").single();
  if (error) throw dbError(error);
  // NEXT_PUBLIC_SITE_URL makes links point at the live site even when the owner works on localhost.
  const site = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const link = `${site}/invite?token=${token}`;
  return json({ invite: mapInvite(data), link }, 201);
});
