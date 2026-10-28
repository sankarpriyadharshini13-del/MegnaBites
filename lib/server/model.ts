import "server-only";
import { defaultSettings, PRODUCT_COLORS } from "@/lib/admin/defaults";
import type {
  AdminProduct,
  Customer,
  Invite,
  Member,
  Order,
  OrderStatus,
  PayMethod,
  PaymentStatus,
  Refund,
  Settings,
  StockLogEntry,
} from "@/lib/admin/types";
import { HttpError } from "./http";
import { publicUrl } from "./supabase";

/* ------------------------------------------------------------- DB → app shapes */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export const BUCKET = "admin-assets";
export const storagePrefix = () => `${publicUrl.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;

export function mapProduct(r: Row): AdminProduct {
  return {
    id: r.id,
    name: r.name,
    sku: r.sku ?? "",
    price: r.price ?? null,
    originalPrice: r.original_price ?? null,
    stock: r.stock ?? 0,
    packSize: r.pack_size ?? "",
    tag: r.tag ?? "",
    description: r.description ?? "",
    barcode: r.barcode ?? "",
    visible: !!r.visible,
    images: r.images ?? [],
    color: r.color ?? PRODUCT_COLORS[0],
  };
}

export function mapOrder(r: Row): Order {
  const events = [...(r.order_events ?? [])].sort((a: Row, b: Row) => a.at.localeCompare(b.at));
  return {
    number: Number(r.number),
    placedAt: r.placed_at,
    customerId: r.customer_id,
    items: (r.order_items ?? []).map((i: Row) => ({
      productId: i.product_id ?? "",
      name: i.name,
      packSize: i.pack_size ?? "",
      qty: i.qty,
      price: i.price,
    })),
    shipping: r.shipping ?? 0,
    method: r.method as PayMethod,
    status: r.status as OrderStatus,
    address: r.address ?? "",
    timeline: events.map((e: Row) => ({ label: e.label, note: e.note ?? undefined, at: e.at })),
    payment: { id: r.payment_id ?? "", status: r.payment_status as PaymentStatus, refunded: r.payment_refunded ?? 0 },
    email: r.email ?? "",
    shipName: r.ship_name ?? "",
    shipPhone: r.ship_phone ?? "",
    location: { city: r.ship_city ?? "", state: r.ship_state ?? "", pincode: r.ship_pincode ?? "" },
    deliveredAt: r.delivered_at ?? null,
  };
}

export function mapCustomer(r: Row): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone ?? "",
    email: r.email ?? "",
    area: r.area ?? undefined,
    city: r.city ?? "",
    state: r.state ?? "",
    since: r.since,
    notes: [...(r.customer_notes ?? [])]
      .sort((a: Row, b: Row) => b.at.localeCompare(a.at))
      .map((n: Row) => ({ id: n.id, text: n.text, at: n.at })),
  };
}

export const mapRefund = (r: Row): Refund => ({
  id: r.id,
  orderNumber: Number(r.order_number),
  amount: r.amount,
  reason: r.reason,
  note: r.note ?? "",
  at: r.at,
});

export const mapStockLog = (r: Row): StockLogEntry => ({ id: r.id, at: r.at, text: r.text, delta: r.delta });

export const mapMember = (r: Row): Member => ({
  userId: r.user_id,
  email: r.email,
  name: r.name ?? null,
  role: r.role,
  createdAt: r.created_at,
});

export function mapInvite(r: Row, now = Date.now()): Invite {
  const status: Invite["status"] = r.accepted_at
    ? "accepted"
    : r.revoked_at
      ? "revoked"
      : new Date(r.expires_at).getTime() < now
        ? "expired"
        : "pending";
  return { id: r.id, email: r.email, name: r.name ?? null, createdAt: r.created_at, expiresAt: r.expires_at, status };
}

/** Saved settings merged over the defaults so older rows keep working when new options appear. */
export function mergeSettings(saved: Row | null | undefined): Settings {
  const d = defaultSettings();
  const s = (saved ?? {}) as Partial<Settings>;
  return {
    store: { ...d.store, ...(s.store ?? {}) },
    razorpay: { ...d.razorpay, ...(s.razorpay ?? {}) },
    notifications: { ...d.notifications, ...(s.notifications ?? {}) },
    invoice: { ...d.invoice, ...(s.invoice ?? {}) },
  };
}

/* ------------------------------------------------------------------ validation */

const bad = (message: string) => new HttpError(400, message);
const str = (v: unknown, field: string, max: number, opts: { required?: boolean } = {}) => {
  if (v === undefined || v === null) {
    if (opts.required) throw bad(`${field} is required.`);
    return "";
  }
  if (typeof v !== "string") throw bad(`${field} must be text.`);
  const t = v.trim();
  if (opts.required && !t) throw bad(`${field} is required.`);
  if (t.length > max) throw bad(`${field} must be at most ${max} characters.`);
  return t;
};
const int = (v: unknown, field: string, min: number, max: number) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
    throw bad(`${field} must be a whole number between ${min} and ${max}.`);
  }
  return v;
};

export const isAllowedImage = (u: unknown): u is string =>
  typeof u === "string" &&
  u.length < 600 &&
  ((u.startsWith("/images/") && !u.includes("..")) || u.startsWith(storagePrefix()));

export interface ProductInput {
  id?: string;
  name: string;
  price: number | null;
  originalPrice: number | null;
  stock: number;
  packSize: string;
  tag: string;
  description: string;
  visible: boolean;
  images: string[];
}

export function parseProduct(body: Row): ProductInput {
  const name = str(body.name, "Product name", 120, { required: true });
  let price: number | null = null;
  if (body.price !== null && body.price !== undefined && body.price !== "") price = int(body.price, "Price", 0, 10_000_000);
  let originalPrice: number | null = null;
  if (body.originalPrice !== null && body.originalPrice !== undefined && body.originalPrice !== "")
    originalPrice = int(body.originalPrice, "Original price", 0, 10_000_000);
  if (originalPrice != null && price == null) throw bad("Add a selling price along with the original price.");
  if (originalPrice != null && price != null && originalPrice < price) throw bad("Original price can't be lower than the selling price.");
  const stock = int(body.stock ?? 0, "Stock", 0, 1_000_000);
  const images = body.images ?? [];
  if (!Array.isArray(images) || images.length > 5) throw bad("A product can have at most 5 photos.");
  if (!images.every(isAllowedImage)) throw bad("One of the photos isn't from this store's uploads.");
  if (typeof body.visible !== "boolean") throw bad("Visibility must be on or off.");
  if (body.visible && price == null) throw bad("Add a price before making the product visible.");
  let id: string | undefined;
  if (body.id !== undefined && body.id !== null) {
    if (typeof body.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(body.id) || body.id.length > 80) throw bad("Invalid product id.");
    id = body.id;
  }
  return {
    id,
    name,
    price,
    originalPrice,
    stock,
    packSize: str(body.packSize, "Pack size", 40),
    tag: str(body.tag, "Tag", 30),
    description: str(body.description, "Description", 2000),
    visible: body.visible,
    images: Array.from(new Set(images as string[])),
  };
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";

export function skuFor(name: string, packSize: string, current: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length || !packSize.trim()) return current;
  const code = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
  const m = /([\d.]+)\s*(kg|g)?/i.exec(packSize);
  const size = m ? Math.round(parseFloat(m[1]) * (m[2]?.toLowerCase() === "kg" ? 1000 : 1)) : 0;
  return `MEB-${code.toUpperCase()}-${size || packSize.replace(/\W/g, "").toUpperCase()}`;
}

/** 12-digit barcodes step by 7 from the highest existing one, matching the printed label sheet. */
export function nextBarcode(existing: (string | null)[]) {
  const nums = existing.map((b) => Number(b)).filter((n) => Number.isFinite(n) && n > 0);
  return String((nums.length ? Math.max(...nums) : 890123450010) + 7);
}

export function parseSettings(body: Row): Settings {
  const d = defaultSettings();
  const s = (body.settings ?? body) as Row;
  const store = (s.store ?? {}) as Row;
  const rz = (s.razorpay ?? {}) as Row;
  const nt = (s.notifications ?? {}) as Row;
  const iv = (s.invoice ?? {}) as Row;
  const email = str(store.email, "Store email", 200, { required: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad("Enter a valid store email address.");
  const numberFormat = str(iv.numberFormat, "Invoice number format", 20, { required: true });
  if (!/^[A-Za-z0-9\-_/]*0+$/.test(numberFormat)) throw bad("Invoice number format must end in zeros, e.g. MEB-0000.");
  const bool = (v: unknown, f: boolean) => (typeof v === "boolean" ? v : f);
  let logo: string | null = null;
  if (iv.logo !== null && iv.logo !== undefined) {
    if (!isAllowedImage(iv.logo)) throw bad("The logo isn't from this store's uploads.");
    logo = iv.logo;
  }
  const mode = rz.mode === "Test" ? "Test" : "Live";
  return {
    store: {
      name: str(store.name, "Store name", 120, { required: true }),
      owner: str(store.owner, "Owner", 120),
      address: str(store.address, "Address", 300),
      phone: str(store.phone, "Phone", 30),
      email,
      gstin: str(store.gstin, "GSTIN", 30),
      udyam: str(store.udyam, "Udyam number", 30),
    },
    razorpay: {
      mode,
      upi: bool(rz.upi, d.razorpay.upi),
      cards: bool(rz.cards, d.razorpay.cards),
      netbanking: bool(rz.netbanking, d.razorpay.netbanking),
      cod: bool(rz.cod, d.razorpay.cod),
      payoutAccount: str(rz.payoutAccount, "Payout account", 60),
    },
    notifications: {
      newOrder: bool(nt.newOrder, true),
      lowStock: bool(nt.lowStock, true),
      orderEmail: bool(nt.orderEmail, true),
      whatsapp: bool(nt.whatsapp, false),
    },
    invoice: { footer: str(iv.footer, "Invoice footer", 400), numberFormat, logo },
  };
}

export { bad, int, str };
