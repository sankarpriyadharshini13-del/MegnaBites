import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError, SCHEMA_MISSING, dbError } from "./http";
import { anonClient, supabaseConfigured, userClient } from "./supabase";

export interface AdminCtx {
  /** Supabase client acting as the signed-in admin (RLS applies). */
  client: SupabaseClient;
  userId: string;
  email: string;
  name: string | null;
  role: "owner" | "admin";
  token: string;
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  return m ? m[1] : null;
}

/**
 * Backend authorization for every admin API. The token is verified with Supabase Auth (not just
 * decoded), then the caller must be listed in public.admin_members. Nothing here trusts the browser.
 */
export async function requireAdmin(req: Request, opts: { owner?: boolean } = {}): Promise<AdminCtx> {
  if (!supabaseConfigured) throw new HttpError(503, "Supabase isn't configured on the server.", "not_configured");
  const token = bearer(req);
  if (!token) throw new HttpError(401, "Please sign in.");

  const { data, error } = await anonClient().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Please sign in again.");

  const client = userClient(token);
  const { data: member, error: mErr } = await client
    .from("admin_members")
    .select("role, email, name")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (mErr) throw dbError(mErr);
  if (!member) throw new HttpError(403, "This account doesn't have admin access.");
  if (opts.owner && member.role !== "owner") throw new HttpError(403, "Only the owner can do that.");

  return {
    client,
    userId: data.user.id,
    email: member.email ?? data.user.email ?? "",
    name: member.name ?? null,
    role: member.role as "owner" | "admin",
    token,
  };
}

/** Any signed-in user (used by invitation acceptance, which is how people become admins). */
export async function requireUser(req: Request) {
  if (!supabaseConfigured) throw new HttpError(503, SCHEMA_MISSING, "not_configured");
  const token = bearer(req);
  if (!token) throw new HttpError(401, "Please sign in first.");
  const { data, error } = await anonClient().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Please sign in again.");
  return { user: data.user, client: userClient(token), token };
}
