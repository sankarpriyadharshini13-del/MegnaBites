import { barcodeSvgString } from "./code128";
import { fmtDateYear, groupBarcode, maskPaymentId, orderLabel } from "./format";
import { orderSubtotal, orderTotal } from "./logic";
import type { AdminProduct, Customer, Order, Settings } from "./types";

/**
 * Printable documents (invoice, product label sheet).
 * Each builder returns an HTML fragment sized with container-query units, so the same
 * markup renders as the on-screen preview and as the printed page.
 */

export const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

export const DOC_CSS = `
.doc{container-type:inline-size;color:#111;font-family:Inter,system-ui,Arial,sans-serif;background:#fff}
.doc *{box-sizing:border-box}
.inv{border:.2cqw solid #e5dfcf;border-radius:1.6cqw;overflow:hidden;background:#fff}
.inv-in{padding:3.4cqw 3.4cqw 2.8cqw;font-size:2.3cqw;line-height:1.5}
.inv-head{display:flex;justify-content:space-between;gap:3cqw}
.inv-brand{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:3.2cqw;display:flex;align-items:center;gap:1.4cqw}
.inv-brand img{height:4.4cqw;width:auto;border-radius:.6cqw}
.inv-muted{color:#555}
.inv-right{text-align:right}
.inv-right b{font-size:2.3cqw}
.inv p{margin:2cqw 0 1.6cqw}
.inv table{width:100%;border-collapse:collapse;margin-top:1cqw}
.inv th{font-size:1.9cqw;letter-spacing:.06em;color:#666;text-align:left;font-weight:700;padding:1.2cqw 0;border-bottom:.2cqw solid #e5dfcf}
.inv td{padding:1.1cqw 0;border-bottom:.2cqw solid #efe9da}
.inv th:nth-child(n+2),.inv td:nth-child(n+2){text-align:right}
.inv th:nth-child(2),.inv td:nth-child(2){text-align:left;width:14%}
.inv-tot{text-align:right;margin-top:1.6cqw}
.inv-tot b{font-size:2.8cqw}
.inv-foot{margin-top:2.2cqw;padding-top:1.8cqw;border-top:.2cqw dashed #cfc7b2;color:#555;font-size:2cqw}
.bl{border:.3cqw solid #cfc8b4;border-radius:2.4cqw;padding:4cqw 5cqw 3.2cqw;background:#fff;height:100%;display:flex;flex-direction:column}
.bl b.s{font-size:5.4cqw;line-height:1.25}
.bl .p{font-size:4.4cqw;color:#666;line-height:1.3}
.bl .bars{height:16cqw;margin:2cqw 0 1cqw}
.bl .n{font-size:3.8cqw;text-align:center;color:#333;letter-spacing:.06em}
.bl .pr{font-size:5.2cqw;font-weight:800;margin-top:auto;padding-top:1cqw}
`;

export function printHtml(title: string, body: string, pageCss: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${DOC_CSS}
html,body{margin:0;padding:0;background:#fff}${pageCss}</style></head><body>${body}</body></html>`,
  );
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  const go = () => {
    const win = iframe.contentWindow!;
    win.addEventListener("afterprint", cleanup);
    win.focus();
    win.print();
    setTimeout(cleanup, 120_000);
  };
  // Give the iframe a tick to lay out before printing.
  setTimeout(go, 250);
}

/* -------------------------------- invoice -------------------------------- */

export function invoiceHtml(o: Order, c: Customer, s: Settings) {
  const label = orderLabel(o.number, s.invoice.numberFormat);
  const pay =
    o.payment.status === "pending" ? "Payment pending" : o.payment.refunded >= orderTotal(o) ? `Refunded (${o.method})` : `Paid (${o.method})`;
  const rows = o.items
    .map(
      (i) =>
        `<tr><td>${esc(i.name)} ${esc(i.packSize)}</td><td>${i.qty}</td><td>${inr(i.price)}</td><td>${inr(i.price * i.qty)}</td></tr>`,
    )
    .join("");
  const logo = s.invoice.logo ? `<img src="${esc(s.invoice.logo)}" alt="">` : "";
  const gst = s.store.gstin ? `<div class="inv-muted">GSTIN: ${esc(s.store.gstin)}</div>` : "";
  return `<div class="doc"><div class="inv"><div class="inv-in">
<div class="inv-head"><div><div class="inv-brand">${logo}${esc(s.store.name)}</div><div class="inv-muted">${esc(s.store.address)}</div>${gst}</div>
<div class="inv-right"><b>INVOICE #${esc(label)}</b><div class="inv-muted">${esc(fmtDateYear(o.placedAt))} · ${esc(pay)}</div></div></div>
<p><b>Bill to / Ship to:</b> ${esc(c.name)}, ${esc(o.address)}</p>
<table><thead><tr><th>ITEM</th><th>QTY</th><th>PRICE</th><th>AMOUNT</th></tr></thead><tbody>${rows}</tbody></table>
<div class="inv-tot"><div class="inv-muted">Subtotal ${inr(orderSubtotal(o))} · Shipping ${inr(o.shipping)}</div><b>Total ${inr(orderTotal(o))}</b></div>
<div class="inv-foot">Payment: ${esc(o.method)} · ${esc(maskPaymentId(o.payment.id))} · ${esc(s.invoice.footer)}</div>
</div></div></div>`;
}

/* ------------------------------ product label ------------------------------ */

export function productLabelHtml(p: AdminProduct, storeName: string) {
  return `<div class="doc" style="height:100%"><div class="bl">
<b class="s">${esc(storeName)}</b><div class="p">${esc(p.name)} ${esc(p.packSize)}</div>
<div class="bars">${barcodeSvgString(p.barcode, 40)}</div>
<div class="n">${esc(groupBarcode(p.barcode))}</div>
<div class="pr">${p.price != null ? inr(p.price) : ""}</div></div></div>`;
}

export interface LabelSize {
  id: string;
  label: string;
  w: number;
  h: number;
  cols: number;
}

export const LABEL_SIZES: LabelSize[] = [
  { id: "50x25", label: "50 × 25 mm · 3 per row", w: 50, h: 25, cols: 3 },
  { id: "38x25", label: "38 × 25 mm · 5 per row", w: 38, h: 25, cols: 5 },
  { id: "70x35", label: "70 × 35 mm · 2 per row", w: 70, h: 35, cols: 2 },
  { id: "100x50", label: "100 × 50 mm · 1 per row", w: 100, h: 50, cols: 1 },
];

export function printLabelSheet(products: AdminProduct[], qty: number, size: LabelSize, storeName: string) {
  const cells = Array.from({ length: qty }, (_, i) => products[i % products.length]);
  const body = `<div class="sheet">${cells.map((p) => `<div class="cell">${productLabelHtml(p, storeName)}</div>`).join("")}</div>`;
  printHtml(
    "Label sheet",
    body,
    `@page{size:A4;margin:10mm}.sheet{display:grid;grid-template-columns:repeat(${size.cols},${size.w}mm);gap:2mm}
.cell{width:${size.w}mm;height:${size.h}mm;break-inside:avoid}`,
  );
}

export function printInvoices(entries: { order: Order; customer: Customer }[], s: Settings) {
  const body = entries
    .map((e, i) => `<div class="page${i ? " brk" : ""}">${invoiceHtml(e.order, e.customer, s)}</div>`)
    .join("");
  printHtml("Invoices", body, `@page{size:A4;margin:12mm}.page{width:100%}.brk{break-before:page}`);
}
