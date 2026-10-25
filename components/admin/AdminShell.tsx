"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DOC_CSS } from "@/lib/admin/print";
import { attentionCount } from "@/lib/admin/logic";
import { useAdmin } from "@/lib/admin/store";

const NAV: { group?: string; items: { href: string; label: string }[] }[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/products", label: "Products & Stock" },
      { href: "/admin/barcodes", label: "Barcodes & Labels" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  { group: "INSIGHTS", items: [{ href: "/admin/payments", label: "Payments & Refunds" }] },
  { group: "SETUP", items: [{ href: "/admin/settings", label: "Settings" }] },
];

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="adm-loading" style={{ padding: 24 }}>
      <div className="adm-card" style={{ maxWidth: 440, textAlign: "center" }}>
        <h1 className="adm-title" style={{ fontSize: 20, marginBottom: 8 }}>{title}</h1>
        <div className="adm-muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Front-end guard for the admin area. It only decides what to *show*: every byte of admin data comes
 * from /api/admin/*, which re-checks the session and the admin role on the server.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, errorMessage, retry, data, toasts, dismissToast } = useAdmin();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (status === "signed-out") router.replace("/?signin=1");
  }, [status, router]);

  const toastLayer = (
    <div className="adm-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`adm-toast ${t.tone}`} onClick={() => dismissToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );

  if (status !== "ready" || !data) {
    return (
      <div className="adm">
        {status === "loading" && <div className="adm-loading">Loading…</div>}
        {status === "signed-out" && <div className="adm-loading">Redirecting to sign in…</div>}
        {status === "forbidden" && (
          <Notice title="No admin access">
            This account isn&apos;t authorised to use the admin panel. <Link href="/" style={{ color: "var(--clay)", fontWeight: 600 }}>Back to the shop</Link>
          </Notice>
        )}
        {status === "error" && (
          <Notice title="Couldn't load the admin panel">
            <p>{errorMessage}</p>
            <button type="button" className="adm-btn pri" style={{ marginTop: 14 }} onClick={retry}>Try again</button>
          </Notice>
        )}
        {toastLayer}
      </div>
    );
  }

  const badge = attentionCount(data.orders);
  const storeName = data.settings.store.name || "Magna Eco Bites";

  return (
    <div className="adm">
      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
      <div className={`adm-scrim${open ? " open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`adm-sb${open ? " open" : ""}`} aria-label="Admin navigation">
        <div className="adm-brand">
          <div className="adm-logo" aria-hidden="true" style={data.settings.invoice.logo ? { background: `#fff url(${data.settings.invoice.logo}) center / contain no-repeat`, color: "transparent" } : undefined}>
            {storeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <b>{storeName}</b>
            <span>Admin Console</span>
          </div>
        </div>
        <nav className="adm-nav">
          {NAV.map((g, gi) => (
            <div key={gi} style={{ display: "contents" }}>
              {g.group && <div className="adm-nav-label">{g.group}</div>}
              {g.items.map((it) => {
                const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
                return (
                  <Link key={it.href} href={it.href} className={`adm-nav-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                    {it.label}
                    {it.href === "/admin/orders" && badge > 0 && <span className="adm-badge-n">{badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="adm-main">
        <button type="button" className="adm-menu-btn" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button>
        {children}
      </main>
      {toastLayer}
    </div>
  );
}
