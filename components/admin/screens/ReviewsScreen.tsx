"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { downloadCsv, fmtDate, fmtDateTime, initials } from "@/lib/admin/format";
import { useAdminData } from "@/lib/admin/store";
import type { Review } from "@/lib/admin/types";
import { ConfirmModal, Topbar } from "../ui";

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: "#d9a441", verticalAlign: "middle" }} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      ))}
    </span>
  );
}

type Filter = "all" | 1 | 2 | 3 | 4 | 5;

export default function ReviewsScreen() {
  const { data, mutate, label, now } = useAdminData();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<Review | null>(null);

  const reviews = data.reviews;
  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return {
      total,
      avg,
      dist,
      fiveShare: total ? Math.round((dist[0].count / total) * 100) : 0,
      thisMonth: reviews.filter((r) => new Date(r.createdAt).getTime() >= monthStart).length,
      withText: reviews.filter((r) => r.message).length,
    };
  }, [reviews, now]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        (filter === "all" || r.rating === filter) &&
        (!q || r.customerName.toLowerCase().includes(q) || r.message.toLowerCase().includes(q) || r.products.toLowerCase().includes(q) || label(r.orderNumber).toLowerCase().includes(q)),
    );
  }, [reviews, filter, query, label]);

  const maxCount = Math.max(1, ...stats.dist.map((d) => d.count));

  const exportCsv = () =>
    downloadCsv("reviews.csv", [
      ["Date", "Customer", "Rating", "Review", "Order", "Products"],
      ...list.map((r) => [fmtDateTime(r.createdAt), r.customerName, r.rating, r.message, label(r.orderNumber), r.products]),
    ]);

  return (
    <>
      <Topbar title="Reviews" subtitle="What customers say after they order">
        <input className="adm-search" placeholder="Search customer, review, product..." aria-label="Search reviews" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="adm-btn lg" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </Topbar>

      <div className="adm-kpis p-kpis">
        <div className="adm-kpi">
          <div className="l">Average rating</div>
          <div className="v">{stats.total ? stats.avg.toFixed(1) : "—"} {stats.total > 0 && <Stars value={Math.round(stats.avg)} size={16} />}</div>
          <div className="d">{stats.total ? `from ${stats.total} review${stats.total === 1 ? "" : "s"}` : "No reviews yet"}</div>
        </div>
        <div className="adm-kpi"><div className="l">Total reviews</div><div className="v">{stats.total}</div><div className="d">{stats.thisMonth} this month</div></div>
        <div className="adm-kpi"><div className="l">5-star reviews</div><div className="v">{stats.fiveShare}%</div><div className="d">{stats.dist[0].count} of {stats.total}</div></div>
        <div className="adm-kpi"><div className="l">With a message</div><div className="v">{stats.withText}</div><div className="d">{stats.total - stats.withText} rating only</div></div>
      </div>

      <div className="c-wrap" style={{ gridTemplateColumns: "300px minmax(0, 1fr)" }}>
        <section className="adm-card" aria-label="Rating breakdown">
          <div className="adm-card-h"><h2>Ratings</h2><span>click to filter</span></div>
          <button
            type="button"
            className={`adm-chip${filter === "all" ? " on" : ""}`}
            style={{ marginBottom: 12 }}
            onClick={() => setFilter("all")}
          >
            All <em>{stats.total}</em>
          </button>
          {stats.dist.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => setFilter(filter === d.n ? "all" : (d.n as Filter))}
              aria-pressed={filter === d.n}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", border: 0, background: filter === d.n ? "#fbf3e0" : "transparent", borderRadius: 8, padding: "7px 6px", cursor: "pointer" }}
            >
              <span style={{ width: 34, fontWeight: 700, color: "var(--ink)", fontSize: 13, textAlign: "left" }}>{d.n} ★</span>
              <span style={{ flex: 1, height: 8, borderRadius: 9, background: "#efe8d6", overflow: "hidden" }}>
                <i style={{ display: "block", height: "100%", width: `${(d.count / maxCount) * 100}%`, background: d.n >= 4 ? "#3b5a3a" : d.n === 3 ? "#d9a441" : "#c8602b", borderRadius: 9 }} />
              </span>
              <span style={{ width: 28, textAlign: "right", fontSize: 12.5, color: "var(--muted)" }}>{d.count}</span>
            </button>
          ))}
        </section>

        <section className="adm-card" aria-label="Customer reviews" style={{ minHeight: 420 }}>
          <div className="adm-card-h">
            <h2>{filter === "all" ? "All reviews" : `${filter}-star reviews`}</h2>
            <span>{list.length} shown</span>
          </div>
          {list.length === 0 ? (
            <div className="adm-empty">
              {stats.total ? "No reviews match this filter." : "No reviews yet. Customers are asked for a review right after they place an order."}
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {list.map((r) => (
                <li key={r.id} style={{ display: "flex", gap: 12, padding: "14px 0", borderTop: "1px solid var(--line-soft)" }}>
                  <div className="c-av" style={{ width: 36, height: 36, fontSize: 14 }}>{initials(r.customerName)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px" }}>
                      <b style={{ color: "var(--ink)", fontSize: 13.5 }}>{r.customerName}</b>
                      <Stars value={r.rating} />
                      <span className="adm-muted">{fmtDate(r.createdAt)}</span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: r.message ? "var(--text)" : "var(--muted)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {r.message || "Rating only — no message."}
                    </p>
                    <p className="adm-muted" style={{ marginTop: 6 }}>
                      <Link href={`/admin/orders?order=${r.orderNumber}`} style={{ color: "var(--forest)", fontWeight: 600 }}>Order #{label(r.orderNumber)}</Link>
                      {r.products && <> · {r.products}</>}
                    </p>
                  </div>
                  <button type="button" className="adm-btn sm" style={{ alignSelf: "flex-start" }} onClick={() => setRemoving(r)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {removing && (
        <ConfirmModal
          title="Remove this review?"
          body={`${removing.customerName}'s ${removing.rating}-star review for order #${label(removing.orderNumber)} will be deleted. This can't be undone.`}
          confirmLabel="Remove review"
          onConfirm={() => mutate(`/api/admin/reviews/${removing.id}`, "DELETE", undefined, "Review removed.")}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}
