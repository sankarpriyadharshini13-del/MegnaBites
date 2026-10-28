import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/guard";
import { str } from "@/lib/server/model";
import { loadSettings } from "@/lib/server/orders";
import { randomUUID } from "node:crypto";
import { paymentProvider } from "@/lib/server/payments";
import { createOrder, razorpayConfigured, razorpayKeyId } from "@/lib/server/razorpay";
import { serviceClient, serviceConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const MAX_LINES = 20;
const MAX_QTY = 20;

/**
 * Step 1 of checkout: validates the cart against the database (price, visibility, stock), creates a
 * payment order for the server-computed total (Razorpay, or a simulated one in test mode) and
 * remembers the cart until the payment step completes.
 */
export const POST = handle(async (req) => {
  const { user } = await requireUser(req);
  const dummy = paymentProvider === "dummy";
  if (!serviceConfigured || (!dummy && !razorpayConfigured)) {
    throw new HttpError(503, "Online payment isn't set up yet. Please order by email for now.", "payments_not_configured");
  }
  if (!user.email) throw new HttpError(400, "Your account needs an email address to place an order.");

  const body = await readJson(req, 20_000);
  const name = str(body.name, "Name", 80, { required: true });
  const phoneDigits = String(body.phone ?? "").replace(/\D/g, "").slice(-10);
  if (phoneDigits.length !== 10) throw new HttpError(400, "Enter a valid 10-digit mobile number.");
  const address = str(body.address, "Address", 200, { required: true });
  const city = str(body.city, "City", 60, { required: true });
  const state = str(body.state, "State", 60, { required: true });
  const pincode = String(body.pincode ?? "").trim();
  if (!/^[1-9]\d{5}$/.test(pincode)) throw new HttpError(400, "Enter a valid 6-digit PIN code.");

  const raw = Array.isArray(body.items) ? body.items : [];
  if (!raw.length) throw new HttpError(400, "Your cart is empty.");
  if (raw.length > MAX_LINES) throw new HttpError(400, "Too many different items in one order.");
  const wanted = new Map<string, number>();
  for (const it of raw as { productId?: unknown; quantity?: unknown }[]) {
    const id = typeof it.productId === "string" ? it.productId : "";
    const qty = Number(it.quantity);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new HttpError(400, "One of the cart items isn't valid.");
    wanted.set(id, (wanted.get(id) ?? 0) + qty);
  }

  const sb = serviceClient();
  const { data: rows, error } = await sb.from("products").select("id, name, pack_size, price, stock, visible").in("id", Array.from(wanted.keys()));
  if (error) throw dbError(error);
  const items = [];
  for (const [id, qty] of wanted) {
    const p = rows?.find((r) => r.id === id);
    if (!p || !p.visible) throw new HttpError(409, "An item in your cart is no longer available. Please remove it and try again.");
    if (p.price == null) throw new HttpError(409, `${p.name} doesn't have a price yet. Remove it from the cart to continue.`);
    if (p.stock < qty) throw new HttpError(409, p.stock > 0 ? `Only ${p.stock} × ${p.name} left in stock.` : `${p.name} is out of stock.`);
    items.push({ product_id: p.id, name: p.name, pack_size: p.pack_size ?? "", qty, price: p.price });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = 0;
  const amount = subtotal + shipping;
  if (amount < 1) throw new HttpError(400, "The order total must be at least ₹1.");

  const gatewayOrderId = dummy
    ? `dummy_${randomUUID()}`
    : (await createOrder(amount * 100, `mb_${Date.now()}`, { email: user.email, user_id: user.id })).id;
  const { error: insErr } = await sb.from("pending_checkouts").insert({
    razorpay_order_id: gatewayOrderId,
    user_id: user.id,
    email: user.email,
    name,
    phone: phoneDigits,
    address,
    city,
    state,
    pincode,
    items,
    subtotal,
    shipping,
    amount,
  });
  if (insErr) throw dbError(insErr);

  const settings = await loadSettings(sb);
  return json({
    provider: paymentProvider,
    keyId: dummy ? null : razorpayKeyId,
    orderId: gatewayOrderId,
    amount: amount * 100,
    currency: "INR",
    storeName: settings.store.name,
    logo: settings.invoice.logo,
    prefill: { name, email: user.email, contact: phoneDigits },
    methods: { upi: settings.razorpay.upi, card: settings.razorpay.cards, netbanking: settings.razorpay.netbanking },
  });
});
