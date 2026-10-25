import { dbError, handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import {
  mapCustomer,
  mapInvite,
  mapMember,
  mapOrder,
  mapProduct,
  mapRefund,
  mapStockLog,
  mergeSettings,
} from "@/lib/server/model";
import type { AdminData } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

/** Everything the admin screens display, read from the database as the signed-in admin. */
export const GET = handle(async (req) => {
  const a = await requireAdmin(req);
  const c = a.client;
  const [products, orders, customers, refunds, stock, settings, members, invites] = await Promise.all([
    c.from("products").select("*").order("created_at", { ascending: true }).order("name", { ascending: true }),
    c.from("orders").select("*, order_items(*), order_events(*)").order("number", { ascending: false }).limit(1000),
    c.from("customers").select("*, customer_notes(*)").limit(5000),
    c.from("refunds").select("*").order("at", { ascending: false }).limit(500),
    c.from("stock_log").select("*").order("at", { ascending: false }).limit(200),
    c.from("app_settings").select("data").eq("id", 1).maybeSingle(),
    c.from("admin_members").select("*").order("created_at", { ascending: true }),
    c.from("admin_invites").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const r of [products, orders, customers, refunds, stock, settings, members, invites]) {
    if (r.error) throw dbError(r.error);
  }
  const data: AdminData = {
    me: { userId: a.userId, email: a.email, name: a.name, role: a.role },
    members: (members.data ?? []).map(mapMember),
    invites: (invites.data ?? []).map((r) => mapInvite(r)),
    products: (products.data ?? []).map(mapProduct),
    orders: (orders.data ?? []).map(mapOrder),
    customers: (customers.data ?? []).map(mapCustomer),
    refunds: (refunds.data ?? []).map(mapRefund),
    stockLog: (stock.data ?? []).map(mapStockLog),
    settings: mergeSettings(settings.data?.data),
  };
  return json(data);
});
