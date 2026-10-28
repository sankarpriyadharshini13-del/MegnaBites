const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const d = (v: string | Date) => (v instanceof Date ? v : new Date(v));

export const fmtDate = (v: string | Date) => `${d(v).getDate()} ${MONTHS[d(v).getMonth()]}`;

export const fmtDateYear = (v: string | Date) => `${fmtDate(v)} ${d(v).getFullYear()}`;

export const fmtMonthYear = (v: string | Date) => `${MONTHS[d(v).getMonth()]} ${d(v).getFullYear()}`;

export const fmtDay = (v: string | Date) => `${DAYS[d(v).getDay()]} ${fmtDate(v)}`;

export function fmtTime(v: string | Date) {
  const x = d(v);
  const h = x.getHours();
  const m = String(x.getMinutes()).padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

export const fmtDateTime = (v: string | Date) => `${fmtDate(v)}, ${fmtTime(v)}`;

export const startOfDay = (v: Date) => new Date(v.getFullYear(), v.getMonth(), v.getDate());

export function addWorkingDays(from: Date, n: number) {
  const x = startOfDay(from);
  let left = n;
  while (left > 0) {
    x.setDate(x.getDate() + 1);
    const wd = x.getDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return x;
}

/** "+91 98••• ••455" — keeps the first two and last three digits of the 10-digit number. */
export function maskPhone(phone: string, withCountry = true) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return phone;
  const body = `${digits.slice(0, 2)}••• ••${digits.slice(-3)}`;
  return withCountry ? `+91 ${body}` : body;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, Math.min(5, local.length))}••@${domain}`;
}

/** Display id such as MEB-1042 built from the invoice-number format in Settings (e.g. "MEB-0000"). */
export function orderLabel(num: number, format: string) {
  const m = /^(.*?)(0+)$/.exec(format.trim());
  const prefix = m ? m[1] : "MEB-";
  const width = m ? m[2].length : 4;
  return `${prefix}${String(num).padStart(width, "0")}`;
}

export const isTestPayment = (id: string) => id.startsWith("dummy_");

export const maskPaymentId = (id: string) => (isTestPayment(id) ? "Test payment" : `pay_${id.slice(4, 8)}•••${id.slice(-2)}`);

export const groupBarcode = (code: string) => code.replace(/(\d{4})(?=\d)/g, "$1 ").trim();

export function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
