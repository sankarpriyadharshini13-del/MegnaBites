"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { customerSub, LOW_STOCK, orderTone, orderTotal, orderUnits } from "@/lib/admin/logic";
import { fmtDate, startOfDay } from "@/lib/admin/format";
import { printInvoices } from "@/lib/admin/print";
import { useAdminData } from "@/lib/admin/store";
import type { Order } from "@/lib/admin/types";
import { formatInr } from "@/lib/format";
import { Badge, Topbar } from "../ui";

type Range = "today" | "week" | "month";
const RANGES: { id: Range; label: string; days: number; prev: string }[] = [
  { id: "today", label: "Today", days: 1, prev: "yesterday" },
  { id: "week", label: "This week", days: 7, prev: "last week" },
  { id: "month", label: "Month", days: 30, prev: "last month" },
];

const DAY = 86_400_000;
const STATUS_COLORS: Record<string, string> = { Packed: "#3b5a3a", New: "#d9a441", Cancelled: "#9aa39a" };
const TOP_COLORS = ["#c8602b", "#d9a441", "#3b5a3a"];

const sum = (orders: Order[]) => orders.reduce((s, o) => s + orderTotal(o), 0);
const delta = (cur: number, prev: number, fmt: (n: number) => string, suffix = "") =>
  prev > 0 ? `${cur >= prev ? "▲" : "▼"} ${fmt(Math.abs(cur - prev))}${suffix}` : null;

function Donut({ parts }: { parts: { n: string; v: number; c: string }[] }) {
  const r = 40;
  const C = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.v, 0);
  let offset = 0;
  return (
    <svg viewBox="0 0 110 110" width="106" height="106" role="img" aria-label="Order status split">
      <g transform="rotate(-90 55 55)">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#efe8d6" strokeWidth="13" />
        {parts.filter((p) => p.v > 0).map((p) => {
          const len = (p.v / total) * C;
          const el = <circle key={p.n} cx="55" cy="55" r={r} fill="none" stroke={p.c} strokeWidth="13" strokeDasharray={`${Math.max(len - (parts.length > 1 ? 1.2 : 0), 0)} ${C}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </g>
      <text x="55" y="62" textAnchor="middle" fontFamily="var(--font-display), Georgia, serif" fontWeight="700" fontSize="22" fill="#17301f">{total}</text>
    </svg>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, now, label, mutate } = useAdminData();
  const [range, setRange] = useState<Range>("week");
  const [query, setQuery] = useState("");
  const R = RANGES.find((r) => r.id === range)!;

  const stats = useMemo(() => {
    const valid = data.orders.filter((o) => o.status !== "Cancelled");
    const today0 = startOfDay(now).getTime();
    const from = today0 - (R.days - 1) * DAY;
    const inWin = (o: Order, a: number, b: number) => {
      const t = new Date(o.placedAt).getTime();
      return t >= a && t < b;
    };
    const cur = valid.filter((o) => inWin(o, from, now.getTime() + 1));
    const prev = valid.filter((o) => inWin(o, from - R.days * DAY, from));
    const curAll = data.orders.filter((o) => inWin(o, from, now.getTime() + 1));

    // Sales trend: one point per day over the chart span, vs the same span before it.
    const span = range === "month" ? 30 : 7;
    const series = (offsetDays: number) =>
      Array.from({ length: span }, (_, i) => {
        const dayStart = today0 - (span - 1 - i + offsetDays) * DAY;
        return sum(valid.filter((o) => inWin(o, dayStart, dayStart + DAY)));
      });
    const thisSeries = series(0);
    const prevSeries = series(span);

    const byProduct = new Map<string, number>();
    for (const o of cur) for (const i of o.items) byProduct.set(i.name, (byProduct.get(i.name) ?? 0) + i.price * i.qty);
    const top = [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const perCustomer = new Map<string, number>();
    for (const o of valid) perCustomer.set(o.customerId, (perCustomer.get(o.customerId) ?? 0) + 1);
    const buyers = perCustomer.size;
    const repeat = [...perCustomer.values()].filter((n) => n >= 2).length;
    const cities = new Map<string, number>();
    for (const c of data.customers) if (perCustomer.has(c.id)) cities.set(c.city, (cities.get(c.city) ?? 0) + 1);
    const topCity = [...cities.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      sales: sum(cur),
      prevSales: sum(prev),
      count: cur.length,
      prevCount: prev.length,
      avg: cur.length ? Math.round(sum(cur) / cur.length) : 0,
      prevAvg: prev.length ? Math.round(sum(prev) / prev.length) : 0,
      thisSeries,
      prevSeries,
      span,
      top,
      repeatPct: buyers ? Math.round((repeat / buyers) * 100) : 0,
      topCity,
      status: ["Packed", "New", "Cancelled"].map((n) => ({ n, v: curAll.filter((o) => o.status === n).length, c: STATUS_COLORS[n] })),
    };
  }, [data.orders, data.customers, now, R.days, range]);

  const live = data.products.filter((p) => p.visible);
  const low = live.filter((p) => p.stock <= LOW_STOCK);
  const customers = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers]);
  const recent = data.orders.slice(0, 7);
  const entries = (list: Order[]) => list.map((o) => ({ order: o, customer: customers.get(o.customerId)! }));

  // Chart geometry.
  const max = Math.max(1, ...stats.thisSeries, ...stats.prevSeries);
  const x = (i: number) => 4 + (i * 392) / Math.max(1, stats.span - 1);
  const y = (v: number) => 124 - (v / max) * 100;
  const line = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const tickDates = Array.from({ length: stats.span }, (_, i) => new Date(startOfDay(now).getTime() - (stats.span - 1 - i) * DAY));
  const ticks = tickDates.map((d, i) => ({ i, text: stats.span === 7 ? d.toLocaleDateString("en-IN", { weekday: "short" }) : fmtDate(d) })).filter((t) => stats.span === 7 || t.i % 6 === 0 || t.i === stats.span - 1);
  const topMax = Math.max(1, ...stats.top.map((t) => t[1]));

  const salesDelta = delta(stats.sales, stats.prevSales, (n) => `${Math.round((n / stats.prevSales) * 100)}%`, ` vs ${R.prev}`);
  const countDelta = delta(stats.count, stats.prevCount, (n) => String(n), ` vs ${R.prev}`);
  const avgDelta = delta(stats.avg, stats.prevAvg, (n) => formatInr(n), ` vs ${R.prev}`);
  const owner = data.settings.store.owner || data.me.name || "there";

  return (
    <>
      <Topbar title={`Vanakkam, ${owner}`} subtitle={`Here's how ${data.settings.store.name} is doing ${range === "today" ? "today" : range === "week" ? "this week" : "this month"}`}>
        <input
          className="adm-search"
          placeholder="Search order ID or customer..."
          aria-label="Search orders"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && router.push(`/admin/orders?q=${encodeURIComponent(query.trim())}`)}
        />
        <div className="adm-seg" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" className={range === r.id ? "on" : ""} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
      </Topbar>

      <div className="adm-kpis d-kpis">
        <div className="adm-kpi"><div className="l">Total Sales</div><div className="v">{formatInr(stats.sales)}</div><div className={`d ${salesDelta?.startsWith("▼") ? "bad" : ""}`}>{salesDelta ?? `${stats.count} order${stats.count === 1 ? "" : "s"} so far`}</div></div>
        <div className="adm-kpi"><div className="l">Orders</div><div className="v">{stats.count}</div><div className={`d ${countDelta?.startsWith("▼") ? "bad" : ""}`}>{countDelta ?? "No earlier orders to compare"}</div></div>
        <div className="adm-kpi"><div className="l">Avg. Order Value</div><div className="v">{formatInr(stats.avg)}</div><div className={`d ${avgDelta?.startsWith("▼") ? "bad" : ""}`}>{avgDelta ?? "—"}</div></div>
        <div className="adm-kpi">
          <div className="l">Low Stock</div><div className="v">{low.length}</div>
          <div className={`d ${low.length ? "warn" : ""}`}>{low.length ? low.slice(0, 2).map((p) => `${p.name}${p.packSize ? ` ${p.packSize}` : ""}`).join(" · ") : "All products well stocked"}</div>
        </div>
      </div>

      <div className="adm-grid d-row2">
        <section className="adm-card">
          <div className="adm-card-h"><h2>Sales trend</h2><span>₹ per day · last {stats.span} days</span></div>
          <svg viewBox="0 0 400 130" width="100%" height="130" preserveAspectRatio="none" role="img" aria-label="Sales trend">
            <defs>
              <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c8602b" stopOpacity=".22" />
                <stop offset="1" stopColor="#c8602b" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[22, 66, 110].map((gy) => <line key={gy} x1="0" x2="400" y1={gy} y2={gy} stroke="#eee8d8" />)}
            <path d={`${line(stats.thisSeries)} L${x(stats.span - 1)} 124 L${x(0)} 124 Z`} fill="url(#dg)" />
            <path d={line(stats.prevSeries)} fill="none" stroke="#6b5a45" strokeWidth="1.3" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <path d={line(stats.thisSeries)} fill="none" stroke="#c8602b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <circle cx={x(stats.span - 1)} cy={y(stats.thisSeries[stats.span - 1])} r="4" fill="#c8602b" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {ticks.map((t) => <span key={t.i}>{t.text}</span>)}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            <span><b style={{ color: "#c8602b" }}>━</b> This period</span>
            <span><b>╍</b> Previous period</span>
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Top products</h2><span>by revenue</span></div>
          {stats.top.map(([name, amount], i) => (
            <div className="d-top-row" key={name}>
              <span className="n">{name}</span>
              <span className="bar"><i style={{ width: `${Math.max(6, (amount / topMax) * 100)}%`, background: TOP_COLORS[i] }} /></span>
              <span className="a">{formatInr(amount)}</span>
            </div>
          ))}
          {!stats.top.length && <p className="adm-muted" style={{ margin: "10px 0" }}>No sales in this period yet.</p>}
          <div style={{ borderTop: "1px solid var(--line)", margin: "14px 0 10px" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Stock left</div>
          <div style={{ marginBottom: 12 }}>
            {live.slice(0, 3).map((p) => (
              <span key={p.id} className="d-pill" style={p.stock <= LOW_STOCK ? { background: "#fbe0d2", color: "#b5532a" } : { background: "#ebe9d4", color: "#4a5238" }}>
                {p.name} · {p.stock}
              </span>
            ))}
            {!live.length && <span className="adm-muted">No live products.</span>}
          </div>
          <div className="adm-muted">Repeat customers: <b style={{ color: "var(--ink)" }}>{stats.repeatPct}%</b> · Top city: <b style={{ color: "var(--ink)" }}>{stats.topCity ?? "—"}</b></div>
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Order status</h2><span>{range === "today" ? "today" : range === "week" ? "this week" : "this month"}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Donut parts={stats.status} />
            <ul className="d-legend">
              {stats.status.filter((s) => s.v > 0 || s.n !== "Cancelled").map((s) => (
                <li key={s.n}><i style={{ background: s.c }} />{s.n === "New" ? "New / to pack" : s.n} {s.v}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="adm-grid d-row3">
        <section className="adm-card">
          <div className="adm-card-h"><h2>Recent orders</h2><span>Paid via Razorpay</span></div>
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const c = customers.get(o.customerId);
                  return (
                    <tr key={o.number}>
                      <td className="b">#{label(o.number)}</td>
                      <td>{c ? `${c.name} · ${customerSub(c)}` : "—"}</td>
                      <td>{orderUnits(o)}</td>
                      <td className="b">{formatInr(orderTotal(o))}</td>
                      <td><Badge tone={orderTone(o.status)}>{o.status}</Badge></td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {o.status === "New" && (
                          <button type="button" className="adm-btn sm pri" style={{ marginRight: 4 }} onClick={() => mutate("/api/admin/orders/pack", "POST", { numbers: [o.number] }, "1 order marked packed.")}>Mark packed</button>
                        )}
                        <button type="button" className="adm-btn sm" onClick={() => c && printInvoices(entries([o]), data.settings)}>Invoice</button>
                      </td>
                    </tr>
                  );
                })}
                {!recent.length && <tr><td colSpan={6}><div className="adm-empty">No orders yet. They&apos;ll appear here as soon as customers place them.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
