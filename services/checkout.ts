import { site } from "@/data/site";
import { getProductById } from "@/data/products";
import { formatInr } from "@/lib/format";
import type { CartItem, UserProfile } from "@/types";

/**
 * CHECKOUT SERVICE — integration point.
 * No payment gateway / order backend exists in the project. Until one is added
 * (Razorpay/Stripe + order API), "checkout" opens a pre-filled order enquiry
 * email to the shop so no order is lost. Replace `startCheckout` to integrate.
 */
export function buildOrderMailto(items: CartItem[], user: UserProfile | null) {
  const lines = items.map((i) => {
    const p = getProductById(i.productId);
    if (!p) return "";
    const price = p.priceInr != null ? ` — ${formatInr(p.priceInr * i.quantity)}` : "";
    const size = p.packSize ? ` (${p.packSize})` : "";
    return `• ${p.name}${size} × ${i.quantity}${price}`;
  });
  const body = [
    "Hello Magna Eco Bites, I'd like to order:",
    "",
    ...lines,
    "",
    user ? `Name: ${user.name}\nEmail: ${user.email}` : "Name:\nPhone / address:",
  ].join("\n");
  return `mailto:${site.email}?subject=${encodeURIComponent("Order enquiry")}&body=${encodeURIComponent(body)}`;
}

export function startCheckout(items: CartItem[], user: UserProfile | null) {
  window.location.href = buildOrderMailto(items, user);
}
