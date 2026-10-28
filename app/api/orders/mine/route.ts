import { orderLabel } from "@/lib/admin/format";
import { dbError, handle, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/guard";
import { loadSettings } from "@/lib/server/orders";
import { serviceClient, serviceConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The signed-in customer's own orders. Read with the customer's session, so row-level security
 * (orders_own_read & co.) guarantees nobody can see anyone else's orders.
 */
export const GET = handle(async (req) => {
  const { client } = await requireUser(req);
  const base =
    "number, placed_at, status, shipping, address, ship_name, ship_phone, method, payment_id, payment_refunded, delivered_at, order_items(product_id, name, pack_size, qty, price), order_events(label, note, at)";
  const query = (cols: string) => client.from("orders").select(cols).order("number", { ascending: false }).limit(100);
  let { data, error } = await query(`${base}, reviews(rating, message, created_at)`);
  // Before the reviews migration is applied, still show orders (just without reviews).
  if (error && ["PGRST200", "PGRST205", "42P01"].includes(error.code ?? "")) ({ data, error } = await query(base));
  if (error) throw dbError(error);

  // Order numbers follow the store's invoice format (Settings is admin-only, so read it on the server).
  const format = serviceConfigured ? (await loadSettings(serviceClient())).invoice.numberFormat : "MEB-0000";

  const orders = (data ?? []).map((o: any) => {
    const items = (o.order_items ?? []).map((i: any) => ({
      productId: i.product_id ?? null,
      name: i.name,
      packSize: i.pack_size ?? "",
      qty: i.qty,
      price: i.price,
    }));
    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
    const rv = Array.isArray(o.reviews) ? o.reviews[0] : o.reviews;
    return {
      number: Number(o.number),
      label: orderLabel(Number(o.number), format),
      placedAt: o.placed_at,
      status: o.status as "New" | "Packed" | "Delivered" | "Cancelled",
      items,
      subtotal,
      shipping: o.shipping ?? 0,
      total: subtotal + (o.shipping ?? 0),
      refunded: o.payment_refunded ?? 0,
      address: o.address ?? "",
      shipName: o.ship_name ?? "",
      shipPhone: o.ship_phone ?? "",
      method: o.method,
      testPayment: String(o.payment_id ?? "").startsWith("dummy_"),
      deliveredAt: o.delivered_at ?? null,
      review: rv ? { rating: rv.rating, message: rv.message ?? "", createdAt: rv.created_at } : null,
      timeline: [...(o.order_events ?? [])]
        .sort((a: any, b: any) => a.at.localeCompare(b.at))
        .map((e: any) => ({ label: e.label, note: e.note ?? null, at: e.at })),
    };
  });
  return json({ orders });
});
