import type { CartItem } from "@/types";

const KEY = "magna-cart-v1";

export function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (i) => typeof i?.productId === "string" && Number.isInteger(i?.quantity) && i.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode) — cart still works in memory */
  }
}
