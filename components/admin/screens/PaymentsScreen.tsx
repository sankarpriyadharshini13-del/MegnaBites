"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addWorkingDays, downloadCsv, fmtDate, fmtDay, maskPaymentId, startOfDay } from "@/lib/admin/format";
import { paymentView, refundable, type PaymentView } from "@/lib/admin/logic";
import { useAdminData } from "@/lib/admin/store";
import type { Order } from "@/lib/admin/types";
import { formatInr } from "@/lib/format";
import { Badge, ConfirmModal, Topbar, useQueryParam } from "../ui";

const DAY = 86_400_000;

const destination = (m: Order["method"]) => (m === "UPI" ? "UPI account" : m === "Card" ? "card" : "bank account");

export default function PaymentsScreen() {
  const { data, mutate, now, label, toast } = useAdminData();
  const orderParam = useQueryParam("order");

  const [query, setQuery] = useState("");
  const [selectedNo, setSelectedNo] = useState<number | null>(null);
  const [type, setType] = useState<"full" | "partial">("full");
  const [partial, setPartial] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const initialised = useRef(false);

  const customers = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers]);

  const payments = useMemo(() => data.orders.map((o) => ({ o, v: paymentView(o, now) })), [data.orders, now]);

  const pick = (no: number | null) => {
    setSelectedNo(no);
    setType("full");
    setPartial("");
    setReason("");
    setNote("");
  };

  useEffect(() => {
    if (initialised.current || orderParam === undefined) return;
    initialised.current = true;
    const fromUrl = orderParam ? Number(orderParam.replace(/\D/g, "")) : NaN;
    const target =
      data.orders.find((o) => o.number === fromUrl) ??
      data.orders.find((o) => o.payment.status !== "pending");
    pick(target?.number ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderParam]);

  /* ---- summary figures ---- */
  const t = now.getTime();
  const inWindow = (iso: string, from: number, to: number) => {
    const age = (t - new Date(iso).getTime()) / DAY;
    return age >= from && age < to;
  };
  const sumCollected = (from: number, to: number) =>
    payments.filter((p) => p.v.collected && inWindow(p.o.placedAt, from, to)).reduce((s, p) => s + p.v.amount, 0);
  const collected = sumCollected(0, 30);
  const previous = sumCollected(30, 60);
  const change = previous > 0 ? Math.round(((collected - previous) / previous) * 100) : null;
  const fees = payments.filter((p) => p.v.collected && inWindow(p.o.placedAt, 0, 30)).reduce((s, p) => s + p.v.fee, 0);

  const today = startOfDay(now);
  const upcoming = payments.filter((p) => p.o.payment.status === "captured" && p.v.payout && p.v.payout >= today);
  const pendingSettlement = upcoming.reduce((s, p) => s + p.v.amount - p.v.fee, 0);
  const nextPayout = upcoming.map((p) => p.v.payout!.getTime()).sort((a, b) => a - b)[0];

  const groups = new Map<number, { n: number; sum: number }>();
  for (const p of upcoming) {
    const k = p.v.payout!.getTime();
    const g = groups.get(k) ?? { n: 0, sum: 0 };
    g.n += 1;
    g.sum += p.v.amount - p.v.fee;
    groups.set(k, g);
  }
  const payoutRows = [...groups.entries()].sort((a, b) => a[0] - b[0]).slice(0, 3);
  const pendingNet = payments.filter((p) => p.o.payment.status === "pending").reduce((s, p) => s + p.v.amount - p.v.fee, 0);

  const recentRefunds = data.refunds.filter((r) => inWindow(r.at, 0, 30));
  const refundedTotal = recentRefunds.reduce((s, r) => s + r.amount, 0);

  const q = query.trim().toLowerCase();
  const rows = payments.filter(
    ({ o }) =>
      !q ||
      o.payment.id.toLowerCase().includes(q) ||
      maskPaymentId(o.payment.id).toLowerCase().includes(q) ||
      label(o.number).toLowerCase().includes(q) ||
      String(o.number).includes(q.replace(/^#?(meb-?)?/, "")) && /\d/.test(q),
  );

  /* ---- refund panel ---- */
  const sel = data.orders.find((o) => o.number === selectedNo) ?? null;
  const selView: PaymentView | null = sel ? paymentView(sel, now) : null;
  const selCustomer = sel ? customers.get(sel.customerId) : undefined;
  const max = sel ? refundable(sel) : 0;
  const amount = type === "full" ? max : Number(partial);
  const canRefund = !!sel && sel.payment.status !== "pending" && max > 0;
  const hint = sel?.status === "Cancelled" ? " · order cancelled" : "";

  const exportCsv = () =>
    downloadCsv("payments.csv", [
      ["Payment ID", "Order", "Method", "Amount (INR)", "Fee (INR)", "Status", "Payout"],
      ...rows.map(({ o, v }) => [o.payment.id, label(o.number), o.method, v.amount, v.fee, v.label, v.payout ? fmtDate(v.payout) : ""]),
    ]);

  return (
    <>
      <Topbar title="Payments & Refunds" subtitle="Money in, fees, payouts and refunds — powered by Razorpay">
        <input className="adm-search" placeholder="Search payment ID or order..." aria-label="Search payments" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="adm-btn lg" onClick={exportCsv}>Export CSV</button>
      </Topbar>

      <div className="adm-kpis y-kpis">
        <div className="adm-kpi">
          <div className="l">Collected (30 days)</div><div className="v">{formatInr(collected)}</div>
          <div className={`d ${change != null && change < 0 ? "bad" : ""}`}>{change == null ? "No earlier period to compare" : `${change < 0 ? "▼" : "▲"} ${Math.abs(change)}%`}</div>
        </div>
        <div className="adm-kpi">
          <div className="l">Pending settlement</div><div className="v">{formatInr(pendingSettlement)}</div>
          <div className="d">{nextPayout ? `Next payout ${fmtDay(new Date(nextPayout))}` : "Nothing pending"}</div>
        </div>
        <div className="adm-kpi">
          <div className="l">Refunded</div><div className="v">{formatInr(refundedTotal)}</div>
          <div className="d warn">{recentRefunds.length} refund{recentRefunds.length === 1 ? "" : "s"}</div>
        </div>
        <div className="adm-kpi">
          <div className="l">Gateway fees</div><div className="v">{formatInr(fees)}</div>
          <div className="d warn">≈ {collected ? Math.round((fees / collected) * 100) : 2}% of sales</div>
        </div>
      </div>

      <div className="y-wrap">
        <div className="p-col">
          <section className="adm-card">
            <div className="adm-card-h"><h2>Payments</h2><span>Razorpay · {data.settings.razorpay.mode.toLowerCase()} mode</span></div>
            <div className="adm-scroll y-pay">
              <table className="adm-table">
                <thead><tr><th>Payment ID</th><th>Order</th><th>Method</th><th>Amount</th><th>Fee</th><th>Status</th><th>Payout</th></tr></thead>
                <tbody>
                  {rows.map(({ o, v }) => (
                    <tr key={o.number} className={`click${selectedNo === o.number ? " sel" : ""}`} style={{ height: 41 }} onClick={() => pick(o.number)}>
                      <td className="mono" style={{ color: "#4a4f46" }}>{maskPaymentId(o.payment.id)}</td>
                      <td className="b">#{o.number}</td>
                      <td>{o.method}</td>
                      <td className="b">{formatInr(v.amount)}</td>
                      <td style={{ color: "var(--muted)" }}>{formatInr(v.fee)}</td>
                      <td><Badge tone={v.tone}>{v.label}</Badge></td>
                      <td style={{ color: "var(--muted)" }}>{v.payout ? (v.payout >= today ? fmtDay(v.payout) : fmtDate(v.payout)) : "—"}</td>
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={7}><div className="adm-empty">No payments match your search.</div></td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-h"><h2>Upcoming payouts</h2><span>{data.settings.razorpay.payoutAccount ? `to ${data.settings.razorpay.payoutAccount}` : "set a payout account in Settings"}</span></div>
            {payoutRows.map(([k, g]) => (
              <div className="y-up" key={k}>
                <span><b>{fmtDay(new Date(k))}</b> · {g.n} payment{g.n === 1 ? "" : "s"}</span>
                <b>{formatInr(g.sum)}</b>
              </div>
            ))}
            {pendingNet > 0 && (
              <div className="y-up">
                <span><b>{fmtDay(addWorkingDays(now, 3))}</b> · expected</span>
                <span className="adm-muted">{formatInr(pendingNet)} (estimate)</span>
              </div>
            )}
            {!payoutRows.length && pendingNet <= 0 && <div className="adm-empty" style={{ padding: "10px 0" }}>No upcoming payouts.</div>}
          </section>
        </div>

        <section className="adm-card" aria-label="Issue refund" style={{ minHeight: 640 }}>
          <div className="adm-card-h">
            <h2>Issue refund</h2>
            {sel && <Badge tone="red">Order #{label(sel.number)}</Badge>}
          </div>
          {sel && selView ? (
            <>
              <p className="adm-muted" style={{ marginBottom: 14 }}>
                {selCustomer?.name} · {selCustomer?.city} · {formatInr(selView.amount)} paid via {sel.method}{hint}
              </p>
              <div className="adm-fl">Refund type</div>
              <div className="y-types adm-fg">
                <button type="button" className={`adm-chip${type === "full" ? " on" : ""}`} onClick={() => setType("full")}>Full {formatInr(max)}</button>
                <button type="button" className={`adm-chip${type === "partial" ? " on" : ""}`} onClick={() => setType("partial")}>Partial</button>
              </div>
              {type === "partial" && (
                <div className="adm-fg">
                  <label className="adm-fl" htmlFor="rf-amt">Amount (₹, up to {formatInr(max)})</label>
                  <input id="rf-amt" className="adm-in" inputMode="numeric" value={partial} onChange={(e) => setPartial(e.target.value.replace(/\D/g, ""))} />
                </div>
              )}
              <div className="adm-fg">
                <label className="adm-fl" htmlFor="rf-reason">Reason</label>
                <input id="rf-reason" className="adm-in" value={reason} placeholder="e.g. Damaged item" onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="adm-fg">
                <label className="adm-fl" htmlFor="rf-note">Note to customer (optional)</label>
                <textarea id="rf-note" className="adm-ta" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="adm-note" style={{ marginBottom: 14 }}>
                Refund goes back to the original {destination(sel.method)} in about 5–7 working days.{" "}
                {data.settings.notifications.orderEmail ? "Customer gets an email automatically." : "Customer emails are switched off in Settings."}
              </div>
              {sel.payment.status === "pending" && <p className="adm-err" style={{ marginBottom: 10 }}>This payment is still pending — there is nothing to refund yet.</p>}
              {sel.payment.status !== "pending" && max <= 0 && <p className="adm-err" style={{ marginBottom: 10 }}>This order has already been refunded in full.</p>}
              <div className="p-btns">
                <button
                  className="adm-btn pri lg"
                  disabled={!canRefund}
                  onClick={() => {
                    if (!Number.isFinite(amount) || amount <= 0) return toast("Enter a refund amount greater than ₹0.", "error");
                    if (amount > max) return toast(`You can refund at most ₹${max} on this order.`, "error");
                    if (!reason.trim()) return toast("Add a reason for the refund.", "error");
                    setConfirm(true);
                  }}
                >
                  Refund {formatInr(Number.isFinite(amount) && amount > 0 ? amount : 0)}
                </button>
                <button className="adm-btn lg" onClick={() => pick(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="adm-empty">Select a payment from the table to issue a refund.</div>
          )}

          <div style={{ marginTop: 22 }}>
            <div className="adm-card-h"><h2>Recent refunds</h2><span>last 30 days</span></div>
            {recentRefunds.slice(0, 5).map((r) => (
              <div className="y-up" key={r.id}>
                <span><b>#{label(r.orderNumber)}</b> · {r.reason}</span>
                <span><b>{formatInr(r.amount)}</b> · <Badge tone="green">Done</Badge></span>
              </div>
            ))}
            {!recentRefunds.length && <div className="adm-empty" style={{ padding: "10px 0" }}>No refunds in the last 30 days.</div>}
          </div>
        </section>
      </div>

      {confirm && sel && (
        <ConfirmModal
          title={`Refund ${formatInr(amount)}?`}
          body={`${formatInr(amount)} will be refunded to ${selCustomer?.name}'s ${destination(sel.method)} for order #${label(sel.number)}. This can't be undone.`}
          confirmLabel={`Refund ${formatInr(amount)}`}
          onConfirm={async () => {
            const res = await mutate("/api/admin/refunds", "POST", { orderNumber: sel.number, amount, reason, note }, `Refund of ${formatInr(amount)} recorded for ${label(sel.number)}.`);
            if (res.ok) {
              setType("full");
              setPartial("");
              setReason("");
              setNote("");
            }
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </>
  );
}
