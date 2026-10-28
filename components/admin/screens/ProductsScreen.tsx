"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fmtDateTime, groupBarcode, initials } from "@/lib/admin/format";
import { compressImage } from "@/lib/admin/image";
import { LOW_STOCK, nextBarcode, productStatus } from "@/lib/admin/logic";
import { PRODUCT_COLORS } from "@/lib/admin/defaults";
import { useAdminData } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";
import { formatInr } from "@/lib/format";
import { Badge, BarcodeSvg, ConfirmModal, Modal, PromptModal, Toggle, Topbar } from "../ui";

const MAX_PHOTOS = 5;

interface Draft {
  name: string;
  originalPrice: string;
  price: string;
  stock: string;
  packSize: string;
  tag: string;
  description: string;
  visible: boolean;
  images: string[];
}

const toDraft = (p: AdminProduct | null): Draft => ({
  name: p?.name ?? "",
  originalPrice: p?.originalPrice != null ? String(p.originalPrice) : "",
  price: p?.price != null ? String(p.price) : "",
  stock: p ? String(p.stock) : "0",
  packSize: p?.packSize ?? "",
  tag: p?.tag ?? "",
  description: p?.description ?? "",
  visible: p?.visible ?? false,
  images: p?.images ?? [],
});

export default function ProductsScreen() {
  const { data, mutate, uploadImage, toast } = useAdminData();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(() => data.products[0]?.id ?? "new");
  const isNew = selectedId === "new";
  const product = data.products.find((p) => p.id === selectedId) ?? null;

  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [modal, setModal] = useState<null | "remove" | "preview" | { stockFor: string }>(null);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  /** Opens an empty form, brings it into view and puts the cursor in the name field. */
  const startNew = () => {
    setSelectedId("new");
    setDraft(toDraft(null));
    setErrors({});
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("pf-name")?.focus();
    });
  };

  useEffect(() => {
    setDraft(toDraft(product));
    setErrors({});
  }, [product, selectedId]);

  const live = data.products.filter((p) => p.visible);
  const drafts = data.products.length - live.length;
  const low = live.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK);
  const out = live.filter((p) => p.stock <= 0);
  const units = live.reduce((s, p) => s + p.stock, 0);
  const alerts = data.products.filter((p) => p.visible && p.stock <= LOW_STOCK);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addPhotos = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = MAX_PHOTOS - draft.images.length;
    if (room <= 0) return toast(`You can add up to ${MAX_PHOTOS} photos.`, "error");
    const added: string[] = [];
    setUploading(true);
    for (const f of list.slice(0, room)) {
      try {
        const blob = await compressImage(f);
        const res = await uploadImage(blob, "product");
        if (res.ok && res.data) added.push(res.data.url);
      } catch (e) {
        toast((e as Error).message, "error");
      }
    }
    setUploading(false);
    if (list.length > room) toast(`Only ${room} more photo${room === 1 ? "" : "s"} fit — the rest were skipped.`, "error");
    if (added.length) setDraft((d) => ({ ...d, images: [...d.images, ...added] }));
  };

  /** Product fields the API expects, built from a stored product (used by the quick visibility toggle). */
  const payloadOf = (p: AdminProduct, visible = p.visible) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    packSize: p.packSize,
    tag: p.tag,
    description: p.description,
    visible,
    images: p.images,
  });

  const toggleVisible = (p: AdminProduct, visible: boolean) =>
    mutate("/api/admin/products", "POST", payloadOf(p, visible), visible ? `${p.name} is now visible on the shop.` : `${p.name} is now hidden from the shop.`);

  const save = async () => {
    if (busy || uploading) return;
    const errs: typeof errors = {};
    if (!draft.name.trim()) errs.name = "Product name is required.";
    let price: number | null = null;
    if (draft.price.trim() !== "") {
      price = Number(draft.price);
      if (!Number.isInteger(price) || price < 0) errs.price = "Use a whole number of rupees.";
    } else if (draft.visible) errs.price = "Add a selling price to make this product visible.";
    let originalPrice: number | null = null;
    if (draft.originalPrice.trim() !== "") {
      originalPrice = Number(draft.originalPrice);
      if (!Number.isInteger(originalPrice) || originalPrice < 0) errs.originalPrice = "Use a whole number of rupees.";
      else if (price == null && !errs.price) errs.price = "Add the selling price too.";
      else if (price != null && originalPrice < price) errs.originalPrice = "Can't be lower than the selling price.";
    }
    const stock = draft.stock.trim() === "" ? 0 : Number(draft.stock);
    if (!Number.isInteger(stock) || stock < 0) errs.stock = "Use a whole number, 0 or more.";
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Please fix the highlighted fields.", "error");

    setBusy(true);
    const res = await mutate<{ product: AdminProduct }>(
      "/api/admin/products",
      "POST",
      {
        id: product?.id,
        name: draft.name.trim(),
        price,
        originalPrice,
        stock,
        packSize: draft.packSize.trim(),
        tag: draft.tag.trim(),
        description: draft.description.trim(),
        visible: draft.visible,
        images: draft.images,
      },
      (r) => (isNew ? `${r.product.name} added — it's saved to the database.` : "Changes saved to the database."),
    );
    setBusy(false);
    if (res.ok && isNew && res.data) setSelectedId(res.data.product.id);
  };

  /** Live "was / now" preview while typing both prices. */
  const pricePreview = (() => {
    const price = Number(draft.price);
    const original = Number(draft.originalPrice);
    if (!draft.price.trim() || !draft.originalPrice.trim() || !Number.isInteger(price) || !Number.isInteger(original) || original <= price || price < 0) return null;
    return { price, original, off: Math.round(((original - price) / original) * 100) };
  })();

  const barcode = product?.barcode || (isNew ? nextBarcode(data.products) : "");
  const tint = product?.color ?? PRODUCT_COLORS[data.products.length % PRODUCT_COLORS.length];
  const status = product ? (product.visible ? { label: "Live on site", tone: "green" as const } : { label: "Hidden", tone: "gray" as const }) : { label: "New product", tone: "blue" as const };
  const stockTarget = typeof modal === "object" && modal ? data.products.find((p) => p.id === modal.stockFor) : null;

  const subtitle = (p: AdminProduct) =>
    !p.visible ? "Draft · hidden from site" : [p.packSize, p.tag].filter(Boolean).join(" · ") || "—";

  const tileStyle = (p: AdminProduct): React.CSSProperties =>
    p.images[0] ? { backgroundImage: `url(${p.images[0]})` } : { background: p.color };

  const recent = data.stockLog.slice(0, 5);

  return (
    <>
      <Topbar title="Products & Stock" subtitle="Add, edit or hide products — changes are saved instantly">
        <button type="button" className="adm-btn pri lg" onClick={startNew}>+ Add new product</button>
      </Topbar>

      <div className="adm-kpis p-kpis">
        <div className="adm-kpi"><div className="l">Products</div><div className="v">{data.products.length}</div><div className="d">{live.length} live · {drafts} draft</div></div>
        <div className="adm-kpi"><div className="l">Total units in stock</div><div className="v">{units}</div><div className="d">across {live.length} live items</div></div>
        <div className="adm-kpi"><div className="l">Low stock</div><div className="v">{low.length}</div><div className={`d ${low.length ? "warn" : ""}`}>{low.length ? "Reorder soon" : "All good"}</div></div>
        <div className="adm-kpi"><div className="l">Out of stock</div><div className="v">{out.length}</div><div className={`d ${out.length ? "bad" : ""}`}>{out.length ? "Restock now" : "All good"}</div></div>
      </div>

      <div className="p-wrap">
        <div className="p-col">
          <section className="adm-card">
            <div className="adm-scroll">
              <table className="adm-table">
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th>Visible</th><th /></tr>
                </thead>
                <tbody>
                  {data.products.map((p) => {
                    const st = productStatus(p);
                    return (
                      <tr key={p.id} className={`click${selectedId === p.id ? " sel" : ""}`} style={{ height: 56 }} onClick={() => setSelectedId(p.id)}>
                        <td>
                          <div className="p-cell">
                            <div className="p-tile" style={tileStyle(p)}>{p.images[0] ? "" : p.name === "Coming Soon" ? "?" : initials(p.name)}</div>
                            <div><b>{p.name}</b><span>{subtitle(p)}</span></div>
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)" }}>{p.sku || "—"}</td>
                        <td className="b">
                          {p.price != null ? formatInr(p.price) : "—"}
                          {p.price != null && p.originalPrice != null && p.originalPrice > p.price && (
                            <s style={{ display: "block", fontWeight: 400, fontSize: 11.5, color: "var(--muted)" }}>{formatInr(p.originalPrice)}</s>
                          )}
                        </td>
                        <td>
                          {p.stock} units
                          <div className={`adm-meter${p.stock <= LOW_STOCK ? " low" : ""}`}><i style={{ width: `${Math.min(100, p.stock)}%` }} /></div>
                        </td>
                        <td><Badge tone={st.tone}>{st.label}</Badge></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Toggle checked={p.visible} label={`Show ${p.name} on website`} onChange={(v) => toggleVisible(p, v)} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button className="adm-btn sm" onClick={() => setSelectedId(p.id)}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                  {!data.products.length && <tr><td colSpan={7}><div className="adm-empty">No products yet. Click “+ Add new product”.</div></td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 12 }}>
              <span className="adm-muted">Need to sell something new?</span>
              <button type="button" className="adm-btn pri sm" onClick={startNew}>+ Add new product</button>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-h"><h2>Low-stock alerts</h2><span>alert email at ≤ {LOW_STOCK} units</span></div>
            {alerts.length ? alerts.map((p) => (
              <div className="p-alert" key={p.id}>
                <span><b style={{ color: "var(--ink)" }}>{p.name} {p.packSize}</b> — {p.stock} left</span>
                <button className="adm-btn pri sm" onClick={() => setModal({ stockFor: p.id })}>Update stock</button>
              </div>
            )) : <div className="adm-empty" style={{ padding: "10px 0" }}>Everything is well stocked.</div>}
          </section>

          <section className="adm-card">
            <div className="adm-card-h"><h2>Recent stock changes</h2><span>automatic + manual</span></div>
            {recent.map((l) => (
              <div className="p-log" key={l.id}>
                <span>{l.text}</span>
                <span className={l.delta > 0 ? "plus" : "minus"}>{l.delta > 0 ? "+" : "−"}{Math.abs(l.delta)} · {fmtDateTime(l.at)}</span>
              </div>
            ))}
            {!recent.length && <div className="adm-empty" style={{ padding: "10px 0" }}>No stock changes yet.</div>}
          </section>
        </div>

        <section ref={panelRef} className="adm-card" aria-label={isNew ? "New product" : "Edit product"} style={{ minHeight: 700, display: "flex", flexDirection: "column" }}>
          <div className="adm-card-h"><h2>{isNew ? "New product" : "Edit product"}</h2><Badge tone={status.tone}>{status.label}</Badge></div>

          <div className="p-up">
            <div
              className="p-big"
              style={draft.images[0] ? { backgroundImage: `url(${draft.images[0]})` } : { background: `linear-gradient(135deg, ${tint}22, ${tint}55)`, color: tint }}
            >
              {draft.images[0] ? "" : initials(draft.name || "?")}
            </div>
            <div
              className={`p-drop${over ? " over" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); addPhotos(e.dataTransfer.files); }}
            >
              <div>
                <b>Upload photos</b>
                Drag &amp; drop, up to {MAX_PHOTOS} images<br />auto-compressed for fast loading
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addPhotos(e.target.files); e.target.value = ""; }} />
            </div>
          </div>
          {draft.images.length > 0 && (
            <div className="p-thumbs">
              {draft.images.map((src, i) => (
                <div key={i} style={{ backgroundImage: `url(${src})` }}>
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => set("images", draft.images.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="adm-fg">
            <label className="adm-fl" htmlFor="pf-name">Product name</label>
            <input id="pf-name" className={`adm-in${errors.name ? " err" : ""}`} value={draft.name} onChange={(e) => set("name", e.target.value)} />
            {errors.name && <p className="adm-err">{errors.name}</p>}
          </div>
          <div className="adm-row2 adm-fg" style={{ marginBottom: 6 }}>
            <div>
              <label className="adm-fl" htmlFor="pf-mrp">Original price (₹)</label>
              <input id="pf-mrp" className={`adm-in${errors.originalPrice ? " err" : ""}`} inputMode="numeric" placeholder="Optional, e.g. MRP" aria-describedby="pf-price-hint" value={draft.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} />
              {errors.originalPrice && <p className="adm-err">{errors.originalPrice}</p>}
            </div>
            <div>
              <label className="adm-fl" htmlFor="pf-price">Actual price (selling) (₹)</label>
              <input id="pf-price" className={`adm-in${errors.price ? " err" : ""}`} inputMode="numeric" aria-describedby="pf-price-hint" value={draft.price} onChange={(e) => set("price", e.target.value)} />
              {errors.price && <p className="adm-err">{errors.price}</p>}
            </div>
          </div>
          <p id="pf-price-hint" className="adm-muted" style={{ margin: "0 0 14px", fontSize: 12 }}>
            {pricePreview ? (
              <>Shop shows <s>{formatInr(pricePreview.original)}</s> <b style={{ color: "var(--ink)" }}>{formatInr(pricePreview.price)}</b> · {pricePreview.off}% off</>
            ) : (
              "Customers pay the selling price. Add an original price above it to show a struck-through “was” price."
            )}
          </p>
          <div className="adm-row2 adm-fg">
            <div>
              <label className="adm-fl" htmlFor="pf-stock">Stock</label>
              <input id="pf-stock" className={`adm-in${errors.stock ? " err" : ""}`} inputMode="numeric" value={draft.stock} onChange={(e) => set("stock", e.target.value)} />
              {errors.stock && <p className="adm-err">{errors.stock}</p>}
            </div>
            <div>
              <label className="adm-fl" htmlFor="pf-pack">Pack size</label>
              <input id="pf-pack" className="adm-in" value={draft.packSize} placeholder="e.g. 200 g" onChange={(e) => set("packSize", e.target.value)} />
            </div>
          </div>
          <div className="adm-fg">
            <label className="adm-fl" htmlFor="pf-tag">Tag</label>
            <input id="pf-tag" className="adm-in" value={draft.tag} placeholder="e.g. Bestseller" onChange={(e) => set("tag", e.target.value)} />
          </div>
          <div className="adm-fg">
            <label className="adm-fl" htmlFor="pf-desc">Description</label>
            <textarea id="pf-desc" className="adm-ta" rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="adm-fl">Barcode (auto-generated)</div>
          <div className="p-bc">
            {barcode ? <><BarcodeSvg value={barcode} /><span>{groupBarcode(barcode)}</span></> : <span>Assigned when you save</span>}
          </div>

          <div className="p-vis">
            <span>Visible on website</span>
            <Toggle checked={draft.visible} label="Visible on website" onChange={(v) => set("visible", v)} />
          </div>

          <div className="p-btns" style={{ marginTop: "auto" }}>
            <button className="adm-btn pri lg" onClick={save} disabled={busy || uploading}>{busy ? "Saving…" : isNew ? "Add product" : "Save changes"}</button>
            <button className="adm-btn lg" onClick={() => setModal("preview")} disabled={!draft.name.trim()}>Preview</button>
            {isNew ? (
              <button className="adm-btn lg sp" disabled={busy} onClick={() => setSelectedId(data.products[0]?.id ?? "new")} style={data.products.length ? undefined : { display: "none" }}>Cancel</button>
            ) : (
              <button className="adm-btn dng lg sp" onClick={() => setModal("remove")}>Remove</button>
            )}
          </div>
        </section>
      </div>

      {modal === "remove" && product && (
        <ConfirmModal
          title={`Remove ${product.name}?`}
          body="This deletes the product and its photos. Past orders keep their line items. This can't be undone."
          confirmLabel="Remove product"
          onConfirm={async () => {
            const rest = data.products.filter((p) => p.id !== product.id);
            const res = await mutate(`/api/admin/products/${product.id}`, "DELETE", undefined, `${product.name} removed.`);
            if (res.ok) setSelectedId(rest[0]?.id ?? "new");
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "preview" && (
        <Modal title="Preview" onClose={() => setModal(null)} footer={<button className="adm-btn" onClick={() => setModal(null)}>Close</button>}>
          <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
            <div className="p-big" style={{ width: "100%", height: 190, borderRadius: 0, ...(draft.images[0] ? { backgroundImage: `url(${draft.images[0]})` } : { background: `linear-gradient(135deg, ${tint}22, ${tint}55)`, color: tint }) }}>
              {draft.images[0] ? "" : initials(draft.name)}
            </div>
            <div style={{ padding: 16 }}>
              {draft.tag && <Badge tone="yellow">{draft.tag}</Badge>}
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink)", margin: "8px 0 2px" }}>{draft.name}</h3>
              <p className="adm-muted">{draft.packSize}</p>
              <p style={{ margin: "10px 0", lineHeight: 1.55 }}>{draft.description || "No description yet."}</p>
              {pricePreview && <s className="adm-muted" style={{ marginRight: 8, fontSize: 14 }}>{formatInr(pricePreview.original)}</s>}
              <b style={{ fontSize: 18, color: "var(--ink)" }}>{draft.price.trim() && Number.isFinite(Number(draft.price)) ? formatInr(Number(draft.price)) : "₹—"}</b>
              {pricePreview && <span style={{ marginLeft: 8 }}><Badge tone="green">{pricePreview.off}% off</Badge></span>}
              {!draft.visible && <p className="adm-muted" style={{ marginTop: 8 }}>Hidden — customers won&apos;t see this until you switch on “Visible on website”.</p>}
            </div>
          </div>
        </Modal>
      )}
      {stockTarget && (
        <PromptModal
          title={`Update stock · ${stockTarget.name} ${stockTarget.packSize}`}
          label={`Units to add (currently ${stockTarget.stock})`}
          placeholder="e.g. 40"
          confirmLabel="Add stock"
          validate={(v) => (/^\d+$/.test(v.trim()) && Number(v) > 0 ? null : "Enter a whole number greater than 0.")}
          onSubmit={(v) => mutate(`/api/admin/products/${stockTarget.id}/stock`, "POST", { qty: Number(v) }, `Added ${Number(v)} units to ${stockTarget.name}.`)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

