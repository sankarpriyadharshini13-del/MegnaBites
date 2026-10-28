import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Settings } from "@/lib/admin/types";
import { adminNewOrderEmail, deliveredEmail, orderConfirmationEmail, sendEmail, type EmailOrder } from "./email";
import { mergeSettings } from "./model";

export const EMAIL_ORDER_COLUMNS =
  "number, placed_at, email, ship_name, ship_phone, address, method, payment_id, shipping, order_items(name, pack_size, qty, price)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toEmailOrder(r: any): EmailOrder {
  return {
    number: Number(r.number),
    placedAt: r.placed_at,
    email: r.email ?? "",
    shipName: r.ship_name || "there",
    shipPhone: r.ship_phone ?? "",
    address: r.address ?? "",
    method: r.method ?? "",
    paymentId: r.payment_id ?? "",
    shipping: r.shipping ?? 0,
    items: (r.order_items ?? []).map((i: any) => ({ name: i.name, packSize: i.pack_size ?? "", qty: i.qty, price: i.price })),
  };
}

export async function loadSettings(client: SupabaseClient): Promise<Settings> {
  const { data } = await client.from("app_settings").select("data").eq("id", 1).maybeSingle();
  return mergeSettings(data?.data);
}

/** Customer confirmation + admin notification for a newly paid order. Failures are logged, never thrown. */
export async function notifyOrderPlaced(client: SupabaseClient, orderNumber: number) {
  try {
    const [{ data: row }, settings, { data: owner }] = await Promise.all([
      client.from("orders").select(EMAIL_ORDER_COLUMNS).eq("number", orderNumber).maybeSingle(),
      loadSettings(client),
      client.from("admin_members").select("email").eq("role", "owner").maybeSingle(),
    ]);
    if (!row) return;
    const order = toEmailOrder(row);
    const jobs: Promise<unknown>[] = [];
    if (settings.notifications.orderEmail && order.email) {
      jobs.push(sendEmail({ to: order.email, replyTo: settings.store.email || undefined, ...orderConfirmationEmail(order, settings) }));
    }
    if (settings.notifications.newOrder) {
      const admins = Array.from(new Set([settings.store.email, owner?.email].filter((e): e is string => !!e).map((e) => e.toLowerCase())));
      if (admins.length) jobs.push(sendEmail({ to: admins, replyTo: order.email || undefined, ...adminNewOrderEmail(order, settings) }));
    }
    await Promise.all(jobs);
  } catch (e) {
    console.error("[notify] order emails failed", (e as Error).message);
  }
}

export async function notifyDelivered(client: SupabaseClient, rows: any[]) {
  try {
    const settings = await loadSettings(client);
    if (!settings.notifications.orderEmail) return;
    await Promise.all(
      rows
        .map(toEmailOrder)
        .filter((o) => o.email)
        .map((o) => sendEmail({ to: o.email, replyTo: settings.store.email || undefined, ...deliveredEmail(o, settings) })),
    );
  } catch (e) {
    console.error("[notify] delivery emails failed", (e as Error).message);
  }
}
