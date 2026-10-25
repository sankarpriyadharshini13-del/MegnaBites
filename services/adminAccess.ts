import { getSupabase } from "@/lib/supabase";

/**
 * Asks the server whether the signed-in user is an admin. The answer comes from /api/admin/me, which
 * verifies the session and checks the admin_members table — the browser never decides this itself.
 */
export async function checkAdmin(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  try {
    const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
