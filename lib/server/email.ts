import "server-only";
import { orderLabel } from "@/lib/admin/format";
import type { Settings } from "@/lib/admin/types";

/**
 * Transactional email through Resend's HTTP API (no extra dependency).
 * Needs RESEND_API_KEY and EMAIL_FROM (an address on a domain verified in Resend).
 * Without them, emails are skipped and logged — orders still go through.
 */
const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.EMAIL_FROM ?? "";

export const emailConfigured = Boolean(apiKey && from);

export async function sendEmail(msg: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }) {
  const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).filter(Boolean);
  if (!to.length) return { ok: false, skipped: "no recipient" };
  if (!emailConfigured) {
    console.warn(`[email] not configured — skipped "${msg.subject}" to ${to.join(", ")}`);
    return { ok: false, skipped: "not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: msg.subject, html: msg.html, text: msg.text, reply_to: msg.replyTo }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text().catch(() => ""));
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed", (e as Error).message);
    return { ok: false };
  }
}

/* -------------------------------------------------------------- templates */

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

export interface EmailOrder {
  number: number;
  placedAt: string;
  email: string;
  shipName: string;
  shipPhone: string;
  address: string;
  method: string;
  paymentId: string;
  shipping: number;
  items: { name: string; packSize: string; qty: number; price: number }[];
}

const paymentLine = (o: EmailOrder) =>
  o.paymentId.startsWith("dummy_") ? `${o.method} · test payment (no money was charged)` : `${o.method} · ${o.paymentId}`;

const total = (o: EmailOrder) => o.items.reduce((s, i) => s + i.price * i.qty, 0) + o.shipping;

function layout(s: Settings, title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f2e9;font-family:Arial,Helvetica,sans-serif;color:#25302a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#1b3d2a;color:#fbf7ef;border-radius:16px 16px 0 0;padding:20px 24px">
<div style="font-family:Georgia,serif;font-size:20px;font-weight:bold">${esc(s.store.name)}</div>
<div style="font-size:13px;opacity:.8;margin-top:2px">${esc(title)}</div></div>
<div style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px">${body}
<p style="margin:24px 0 0;font-size:12px;color:#6f7469">${esc(s.invoice.footer || s.store.email)}</p></div></div></body></html>`;
}

function itemsTable(o: EmailOrder) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #efe9da">${esc(i.name)} ${esc(i.packSize)} × ${i.qty}</td><td style="padding:8px 0;border-bottom:1px solid #efe9da;text-align:right">${inr(i.price * i.qty)}</td></tr>`)
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td style="padding:8px 0;color:#6f7469">Delivery</td><td style="padding:8px 0;text-align:right;color:#6f7469">${o.shipping ? inr(o.shipping) : "Free"}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:bold">${inr(total(o))}</td></tr></table>`;
}

const itemsText = (o: EmailOrder) =>
  o.items.map((i) => `- ${i.name} ${i.packSize} x ${i.qty}: ${inr(i.price * i.qty)}`).join("\n") + `\nTotal paid: ${inr(total(o))}`;

export function orderConfirmationEmail(o: EmailOrder, s: Settings) {
  const label = orderLabel(o.number, s.invoice.numberFormat);
  const html = layout(
    s,
    `Order #${label} confirmed`,
    `<p style="margin:0 0 12px;font-size:16px">Hi ${esc(o.shipName)},</p>
<p style="margin:0 0 16px;line-height:1.6">Thank you for your order! We've received your payment and will start packing your order soon.</p>
${itemsTable(o)}
<p style="margin:20px 0 4px;font-weight:bold">Delivering to</p>
<p style="margin:0;line-height:1.6">${esc(o.shipName)} · ${esc(o.shipPhone)}<br>${esc(o.address)}</p>
<p style="margin:16px 0 0;font-size:13px;color:#6f7469">Payment: ${esc(paymentLine(o))}</p>`,
  );
  const text = `Hi ${o.shipName},\n\nThank you for your order #${label}! We've received your payment and will start packing soon.\n\n${itemsText(o)}\n\nDelivering to: ${o.shipName}, ${o.shipPhone}, ${o.address}\nPayment: ${paymentLine(o)}\n\n${s.store.name}`;
  return { subject: `Order #${label} confirmed — ${s.store.name}`, html, text };
}

export function adminNewOrderEmail(o: EmailOrder, s: Settings) {
  const label = orderLabel(o.number, s.invoice.numberFormat);
  const html = layout(
    s,
    `New order #${label}`,
    `<p style="margin:0 0 16px;font-size:16px"><b>New paid order #${esc(label)}</b> — ${inr(total(o))}</p>
${itemsTable(o)}
<p style="margin:20px 0 4px;font-weight:bold">Customer</p>
<p style="margin:0;line-height:1.6">${esc(o.shipName)} · ${esc(o.shipPhone)} · ${esc(o.email)}<br>${esc(o.address)}</p>
<p style="margin:16px 0 0;font-size:13px;color:#6f7469">Payment: ${esc(paymentLine(o))}. Open Admin → Orders to pack it.</p>`,
  );
  const text = `New paid order #${label} — ${inr(total(o))}\n\n${itemsText(o)}\n\nCustomer: ${o.shipName}, ${o.shipPhone}, ${o.email}\n${o.address}\nPayment: ${paymentLine(o)}`;
  return { subject: `New order #${label} · ${inr(total(o))}`, html, text };
}

export function deliveredEmail(o: EmailOrder, s: Settings) {
  const label = orderLabel(o.number, s.invoice.numberFormat);
  const html = layout(
    s,
    `Order #${label} delivered`,
    `<p style="margin:0 0 12px;font-size:16px">Hi ${esc(o.shipName)},</p>
<p style="margin:0 0 16px;line-height:1.6">Your order <b>#${esc(label)}</b> has been delivered. We hope you enjoy it!</p>
${itemsTable(o)}
<p style="margin:16px 0 0;line-height:1.6">If anything is damaged or incorrect, just reply to this email within 48 hours of delivery.</p>`,
  );
  const text = `Hi ${o.shipName},\n\nYour order #${label} has been delivered. We hope you enjoy it!\n\n${itemsText(o)}\n\nIf anything is damaged or incorrect, reply within 48 hours of delivery.\n\n${s.store.name}`;
  return { subject: `Order #${label} delivered — ${s.store.name}`, html, text };
}
