"use client";

import { useEffect, useMemo, useState } from "react";
import { groupBarcode } from "@/lib/admin/format";
import {
  LABEL_SIZES,
  invoiceHtml,
  printInvoices,
  printLabelSheet,
  productLabelHtml,
} from "@/lib/admin/print";
import { useAdminData } from "@/lib/admin/store";
import { BarcodeSvg, Topbar, useQueryParam } from "../ui";

const DEFAULT_QTY = 24;
const MAX_QTY = 500;

export default function BarcodesScreen() {
  const { data, label, toast } = useAdminData();
  const orderParam = useQueryParam("order");

  const [productId, setProductId] = useState<string>("all");
  const [sizeId, setSizeId] = useState(LABEL_SIZES[0].id);
  const [qtyText, setQtyText] = useState(String(DEFAULT_QTY));
  const [qtyFocus, setQtyFocus] = useState(false);
  const [orderNo, setOrderNo] = useState<number | null>(null);

  const printable = useMemo(() => data.products.filter((p) => p.barcode), [data.products]);
  const size = LABEL_SIZES.find((s) => s.id === sizeId) ?? LABEL_SIZES[0];
  const qty = Math.min(MAX_QTY, Math.max(0, parseInt(qtyText.replace(/\D/g, ""), 10) || 0));

  useEffect(() => {
    if (orderParam === undefined || orderNo !== null) return;
    const fromUrl = orderParam ? Number(orderParam.replace(/\D/g, "")) : NaN;
    const target =
      data.orders.find((o) => o.number === fromUrl) ?? data.orders.find((o) => o.status === "Packed") ?? data.orders[0];
    setOrderNo(target?.number ?? null);
  }, [orderParam, orderNo, data.orders]);

  const chosen = productId === "all" ? printable : printable.filter((p) => p.id === productId);
  const sheetProducts = chosen.length ? chosen : printable;
  const previewCount = Math.min(qty, size.cols * 3);

  const order = data.orders.find((o) => o.number === orderNo) ?? null;
  const customer = order ? data.customers.find((c) => c.id === order.customerId) : undefined;

  const printSheet = (products = sheetProducts, count = qty, hint = false) => {
    if (!products.length) return toast("Add a product with a barcode first.", "error");
    if (count < 1) return toast("Enter how many labels to print.", "error");
    printLabelSheet(products, count, size, data.settings.store.name);
    if (hint) toast("In the print dialog, choose “Save as PDF” as the destination.");
  };

  const reset = () => {
    setProductId("all");
    setSizeId(LABEL_SIZES[0].id);
    setQtyText(String(DEFAULT_QTY));
    document.getElementById("barcode-generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Topbar title="Barcodes & Labels" subtitle="Generate product barcodes and print labels and invoices">
        <button type="button" className="adm-btn pri lg" onClick={reset}>+ New label sheet</button>
      </Topbar>

      <div className="b-grid" style={{ marginBottom: 14 }}>
        <section className="adm-card" id="barcode-generator">
          <div className="adm-card-h"><h2>Barcode generator</h2><span>Code 128 · auto-assigned to every product</span></div>
          {printable.map((p) => (
            <div className="b-row" key={p.id}>
              <div><b>{p.name} {p.packSize}</b><span>{groupBarcode(p.barcode)}</span></div>
              <BarcodeSvg value={p.barcode} />
              <button
                className="adm-btn sm"
                onClick={() => {
                  setProductId(p.id);
                  printSheet([p], qty || DEFAULT_QTY);
                }}
              >
                Print labels
              </button>
            </div>
          ))}
          {!printable.length && <div className="adm-empty">No products have barcodes yet. They&apos;re assigned when you add a product.</div>}

          <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 14 }}>
            <div className="adm-row2 adm-fg">
              <div>
                <label className="adm-fl" htmlFor="ls-size">Label size</label>
                <select id="ls-size" className="adm-sel" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
                  {LABEL_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="adm-fl" htmlFor="ls-qty">Quantity</label>
                <input
                  id="ls-qty"
                  className="adm-in"
                  inputMode="numeric"
                  value={qtyFocus ? qtyText : `${qty} labels`}
                  onFocus={() => setQtyFocus(true)}
                  onBlur={() => { setQtyFocus(false); setQtyText(String(qty)); }}
                  onChange={(e) => setQtyText(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
            <div className="adm-fg">
              <label className="adm-fl" htmlFor="ls-prod">Products on the sheet</label>
              <select id="ls-prod" className="adm-sel" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="all">All products (repeating)</option>
                {printable.map((p) => <option key={p.id} value={p.id}>{p.name} {p.packSize} only</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-btn pri lg" onClick={() => printSheet()}>Print label sheet</button>
              <button className="adm-btn lg" onClick={() => printSheet(sheetProducts, qty, true)}>Download PDF</button>
            </div>
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Label sheet preview</h2><span>A4 · sticker paper</span></div>
          <div className="b-sheet" style={{ gridTemplateColumns: `repeat(${size.cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: previewCount }, (_, i) => sheetProducts[i % sheetProducts.length]).map((p, i) => (
              <div
                key={i}
                className="b-cell"
                style={{ aspectRatio: `${size.w} / ${size.h}` }}
                dangerouslySetInnerHTML={{ __html: productLabelHtml(p, data.settings.store.name) }}
              />
            ))}
            {!previewCount && <div className="adm-empty" style={{ gridColumn: "1 / -1" }}>Nothing to preview.</div>}
          </div>
          {qty > previewCount && <p className="adm-muted" style={{ marginTop: 8 }}>Showing the first {previewCount} of {qty} labels.</p>}
        </section>
      </div>

      <div className="b-grid">
        <section className="adm-card">
          <div className="adm-card-h">
            <h2>A4 invoice / packing slip</h2>
            <span>prints cleanly on any printer</span>
          </div>
          <div className="b-opt">
            <label htmlFor="inv-order">Order</label>
            <select id="inv-order" className="adm-sel" style={{ width: "auto", height: 30, minWidth: 190 }} value={orderNo ?? ""} onChange={(e) => setOrderNo(Number(e.target.value))}>
              {data.orders.map((o) => <option key={o.number} value={o.number}>#{label(o.number)}</option>)}
            </select>
            <button className="adm-btn sm" disabled={!order} onClick={() => order && customer && printInvoices([{ order, customer }], data.settings)}>Print</button>
          </div>
          <div className="b-card-doc">
            {order && customer ? <div dangerouslySetInnerHTML={{ __html: invoiceHtml(order, customer, data.settings) }} /> : null}
          </div>
        </section>
      </div>
    </>
  );
}
