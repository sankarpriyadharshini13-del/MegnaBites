"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { downloadCsv, fmtDateTime, isTestPayment, maskEmail, maskPhone } from "@/lib/admin/format";
import { customerSub, orderTone, orderTotal, orderUnits } from "@/lib/admin/logic";
import { printInvoices } from "@/lib/admin/print";
import { useAdminData } from "@/lib/admin/store";
import type { Order } from "@/lib/admin/types";
import { formatInr } from "@/lib/format";
import { Badge, Topbar, useQueryParam } from "../ui";

const PAGE = 9;

type Filter = "All" | "New" | "Packed" | "Delivered";
const FILTERS: Filter[] = ["All", "New", "Packed", "Delivered"];

const matchesFilter = (o: Order, f: Filter) => (f === "All" ? true : o.status === f);

function Timeline({ order, future }: { order: Order; future?: { label: string; note: string }[] }) {
  const lastIdx = order.timeline.length - 1;
  return (
    <ol className="adm-tl">
      {order.timeline.map((e, i) => (
        <li key={i} className={i === lastIdx && (order.status === "New" || order.status === "Packed") ? "cur" : ""}>
          <i />
          <b>{e.label}</b>
          <span>{fmtDateTime(e.at)}{e.note ? ` · ${e.note}` : ""}</span>
        </li>
      ))}
      {future?.map((f) => (
        <li key={f.label} className="todo">
          <i />
          <b>{f.label}</b>
          <span>{f.note}</span>
        </li>
      ))}
    </ol>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { data, mutate, label } = useAdminData();

  const pack = (numbers: number[]) =>
    mutate<{ packed: number; skipped: number }>("/api/admin/orders/pack", "POST", { numbers }, (r) =>
      r.packed ? `${r.packed} order${r.packed > 1 ? "s" : ""} marked packed.${r.skipped ? ` ${r.skipped} skipped.` : ""}` : "Nothing to pack — those orders are already packed.",
    );
  const deliver = (numbers: number[]) =>
    mutate<{ delivered: number; skipped: number }>("/api/admin/orders/deliver", "POST", { numbers }, (r) =>
      r.delivered
        ? `${r.delivered} order${r.delivered > 1 ? "s" : ""} marked delivered — confirmation emailed.${r.skipped ? ` ${r.skipped} skipped (not packed yet).` : ""}`
        : "Only packed orders can be marked delivered.",
    );
  const qParam = useQueryParam("q");
  const orderParam = useQueryParam("order");

  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [activeNo, setActiveNo] = useState<number | null>(null);
  const initialised = useRef(false);

  const customers = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers]);

  useEffect(() => {
    if (initialised.current || qParam === undefined || orderParam === undefined) return;
    initialised.current = true;
    if (qParam) setQuery(qParam);
    const fromUrl = orderParam ? Number(orderParam.replace(/\D/g, "")) : NaN;
    const target = data.orders.find((o) => o.number === fromUrl) ?? data.orders.find((o) => o.status === "New") ?? data.orders[0];
    if (target) {
      setActiveNo(target.number);
      setSelected([target.number]);
      if (!qParam) setPage(Math.floor(data.orders.indexOf(target) / PAGE) + 1);
    }
  }, [qParam, orderParam, data.orders]);

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of FILTERS) c[f] = data.orders.filter((o) => matchesFilter(o, f)).length;
    return c;
  }, [data.orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.orders.filter((o) => {
      if (!matchesFilter(o, filter)) return false;
      if (!q) return true;
      const c = customers.get(o.customerId);
      return (
        label(o.number).toLowerCase().includes(q) ||
        (/\d/.test(q) && String(o.number).includes(q.replace(/^#?meb-?/, ""))) ||
        (c?.name.toLowerCase().includes(q) ?? false) ||
        (c?.city.toLowerCase().includes(q) ?? false) ||
        (c?.area?.toLowerCase().includes(q) ?? false) ||
        o.location.city.toLowerCase().includes(q) ||
        o.location.pincode.includes(q) ||
        o.shipName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
      );
    });
  }, [data.orders, filter, query, customers, label]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const curPage = Math.min(page, pages);
  const rows = filtered.slice((curPage - 1) * PAGE, curPage * PAGE);

  const active = data.orders.find((o) => o.number === activeNo) ?? null;
  const activeCustomer = active ? customers.get(active.customerId) : undefined;

  const toggleSel = (n: number) => {
    setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
    setActiveNo(n);
  };
  const pickRow = (n: number) => {
    setActiveNo(n);
    setSelected([n]);
  };

  const selectedOrders = data.orders.filter((o) => selected.includes(o.number));
  const entries = (list: Order[]) => list.map((o) => ({ order: o, customer: customers.get(o.customerId)! }));

  const exportCsv = () =>
    downloadCsv("orders.csv", [
      ["Order", "Placed", "Customer", "Email", "Phone", "City", "State", "PIN", "Address", "Units", "Amount (INR)", "Payment", "Status"],
      ...filtered.map((o) => {
        const c = customers.get(o.customerId);
        return [
          label(o.number), fmtDateTime(o.placedAt), o.shipName || c?.name || "", o.email || c?.email || "", o.shipPhone || c?.phone || "",
          o.location.city || c?.city || "", o.location.state || c?.state || "", o.location.pincode, o.address,
          orderUnits(o), orderTotal(o), o.method, o.status,
        ];
      }),
    ]);

  const future = (o: Order) =>
    o.status === "New"
      ? [{ label: "Packed", note: "Pending" }, { label: "Delivered", note: "Pending" }]
      : o.status === "Packed"
        ? [{ label: "Delivered", note: "Pending — customer is emailed when marked" }]
        : undefined;
  const locationOf = (o: Order) => {
    if (o.location.city) return { main: o.location.city, sub: [o.location.state, o.location.pincode].filter(Boolean).join(" · ") };
    const c = customers.get(o.customerId);
    return c?.city ? { main: c.city, sub: c.state } : null;
  };

  return (
    <>
      <Topbar title="Orders" subtitle="Every order from the website, with payment and packing status">
        <input
          className="adm-search"
          placeholder="Search order or customer..."
          aria-label="Search orders"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <button type="button" className="adm-btn lg" onClick={exportCsv}>Export CSV</button>
      </Topbar>

      <div className="adm-chips" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} className={`adm-chip${filter === f ? " on" : ""}`} onClick={() => { setFilter(f); setPage(1); }}>
            {f} <em>{counts[f]}</em>
          </button>
        ))}
      </div>

      <div className="o-wrap">
        <section className="adm-card o-panel" style={{ minHeight: 686 }}>
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>
                    <input
                      type="checkbox"
                      className="adm-cb"
                      aria-label="Select all on this page"
                      checked={rows.length > 0 && rows.every((o) => selected.includes(o.number))}
                      onChange={(e) => setSelected(e.target.checked ? Array.from(new Set([...selected, ...rows.map((o) => o.number)])) : selected.filter((n) => !rows.some((o) => o.number === n)))}
                    />
                  </th>
                  <th>Order</th><th>Placed</th><th>Customer</th><th>Customer location</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const c = customers.get(o.customerId);
                  return (
                    <tr key={o.number} className={`click${activeNo === o.number ? " sel" : ""}`} onClick={() => pickRow(o.number)} style={{ height: 46 }}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="adm-cb" aria-label={`Select ${label(o.number)}`} checked={selected.includes(o.number)} onChange={() => toggleSel(o.number)} />
                      </td>
                      <td className="b">#{label(o.number)}</td>
                      <td style={{ color: "#4a4f46" }}>{fmtDateTime(o.placedAt)}</td>
                      <td style={{ lineHeight: 1.25 }}><b style={{ fontWeight: 600, color: "var(--ink)" }}>{c?.name}</b><span className="sub">{c && customerSub(c)}</span></td>
                      <td style={{ lineHeight: 1.25 }}>
                        {(() => {
                          const loc = locationOf(o);
                          return loc ? <><span style={{ color: "var(--ink)" }}>{loc.main}</span>{loc.sub && <span className="sub">{loc.sub}</span>}</> : <span className="adm-muted">—</span>;
                        })()}
                      </td>
                      <td>{orderUnits(o)}</td>
                      <td className="b">{formatInr(orderTotal(o))}</td>
                      <td>{o.method}</td>
                      <td><Badge tone={orderTone(o.status)}>{o.status}</Badge></td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={9}><div className="adm-empty">No orders match your search.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="o-page">
            <span>
              {filtered.length ? `Showing ${(curPage - 1) * PAGE + 1}–${Math.min(curPage * PAGE, filtered.length)} of ${filtered.length} orders` : "Showing 0 orders"}
            </span>
            <div className="o-pg">
              <button type="button" disabled={curPage === 1} onClick={() => setPage(curPage - 1)}>‹ Prev</button>
              {pageList(curPage, pages).map((p, i) =>
                p === "…" ? <button key={`e${i}`} type="button" disabled>…</button> : (
                  <button key={p} type="button" className={p === curPage ? "on" : ""} onClick={() => setPage(p)}>{p}</button>
                ),
              )}
              <button type="button" disabled={curPage === pages} onClick={() => setPage(curPage + 1)}>Next ›</button>
            </div>
          </div>

          <div className="o-bulk">
            <b style={{ color: "var(--ink)", marginRight: 4 }}>{selected.length} order{selected.length === 1 ? "" : "s"} selected</b>
            <button className="adm-btn sm" disabled={!selected.length} onClick={() => printInvoices(entries(selectedOrders), data.settings)}>Print invoices</button>
            <button className="adm-btn sm" disabled={!selected.length} onClick={() => deliver(selected)}>Mark delivered</button>
            <button className="adm-btn pri sm sp" disabled={!selected.length} onClick={() => pack(selected)}>Mark packed</button>
          </div>
        </section>

        <aside className="adm-card o-panel" aria-label="Order details">
          {active && activeCustomer ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 19, color: "var(--ink)" }}>Order #{label(active.number)}</h2>
                <Badge tone={orderTone(active.status)}>{active.status}</Badge>
              </div>
              <p className="adm-muted" style={{ margin: "4px 0 14px" }}>
                Placed {fmtDateTime(active.placedAt)} ·{" "}
                {isTestPayment(active.payment.id)
                  ? `Test payment via ${active.method} (no money collected)`
                  : `${active.payment.status === "pending" ? "Payment pending" : "Paid"} via ${active.method} (Razorpay)`}
              </p>

              {active.status === "New" && (
                <div className="adm-box plain">
                  <div className="adm-box-h">Ready to pack</div>
                  <p>Mark it packed once every item has been scanned and boxed.</p>
                  <div className="adm-box-a">
                    <button className="adm-btn pri sm" onClick={() => pack([active.number])}>Mark packed</button>
                  </div>
                </div>
              )}
              {active.status === "Packed" && (
                <div className="adm-box plain">
                  <div className="adm-box-h">Packed · out for delivery</div>
                  <p>Mark it delivered once the customer has received it — they get a delivery confirmation email.</p>
                  <div className="adm-box-a">
                    <button className="adm-btn pri sm" onClick={() => deliver([active.number])}>Mark delivered</button>
                  </div>
                </div>
              )}

              <div className="o-sec">
                <div className="adm-fl">Customer</div>
                <div className="o-name">{active.shipName || activeCustomer.name}</div>
                <div className="adm-muted">
                  {maskPhone(active.shipPhone || activeCustomer.phone)} · {maskEmail(active.email || activeCustomer.email)}
                </div>
              </div>
              <div className="o-sec">
                <div className="adm-fl">Delivery location</div>
                <div style={{ lineHeight: 1.5 }}>{active.address || "—"}</div>
                {active.deliveredAt && <div className="adm-muted" style={{ marginTop: 4 }}>Delivered {fmtDateTime(active.deliveredAt)}</div>}
              </div>
              <div className="o-sec">
                <div className="adm-fl">Items</div>
                {active.items.map((i) => (
                  <div className="o-items" key={i.productId}>
                    <span>{i.name} {i.packSize} × {i.qty}</span>
                    <span style={{ fontWeight: 600 }}>{formatInr(i.price * i.qty)}</span>
                  </div>
                ))}
                {active.shipping > 0 && (
                  <div className="o-items adm-muted"><span>Shipping</span><span>{formatInr(active.shipping)}</span></div>
                )}
                <div className="o-total"><span>Total</span><span>{formatInr(orderTotal(active))}</span></div>
              </div>
              <div className="o-sec">
                <div className="adm-fl" style={{ marginBottom: 8 }}>Order timeline</div>
                <Timeline order={active} future={future(active)} />
              </div>

              <div className="o-actions">
                <button className="adm-btn" onClick={() => printInvoices(entries([active]), data.settings)}>Invoice PDF</button>
                <button className="adm-btn" onClick={() => router.push(`/admin/payments?order=${active.number}`)}>Refund</button>
              </div>
            </>
          ) : (
            <div className="adm-empty">Select an order to see its details.</div>
          )}
        </aside>
      </div>
    </>
  );
}

function pageList(cur: number, total: number): (number | "…")[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, 3, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}
