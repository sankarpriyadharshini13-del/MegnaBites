import { handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** Tells the browser whether the signed-in user is an admin (used for login redirect + route guard). */
export const GET = handle(async (req) => {
  const a = await requireAdmin(req);
  return json({ me: { userId: a.userId, email: a.email, name: a.name, role: a.role } });
});
