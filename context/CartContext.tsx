"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useProducts } from "./ProductsContext";
import { loadCart, saveCart } from "@/services/cartStorage";
import type { CartItem, Product } from "@/types";

const MAX_QTY = 20;

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; productId: string; quantity: number }
  | { type: "set"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

function reducer(state: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case "hydrate":
      return a.items.map((i) => ({ ...i, quantity: Math.min(i.quantity, MAX_QTY) }));
    case "add": {
      const existing = state.find((i) => i.productId === a.productId);
      if (existing)
        return state.map((i) =>
          i.productId === a.productId ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + a.quantity) } : i,
        );
      return [...state, { productId: a.productId, quantity: Math.min(MAX_QTY, a.quantity) }];
    }
    case "set":
      return a.quantity <= 0
        ? state.filter((i) => i.productId !== a.productId)
        : state.map((i) => (i.productId === a.productId ? { ...i, quantity: Math.min(MAX_QTY, a.quantity) } : i));
    case "remove":
      return state.filter((i) => i.productId !== a.productId);
    case "clear":
      return [];
  }
}

/** Shown when a customer tries to go past the stock left (or the per-order limit). */
export interface LimitNotice {
  productId: string;
  name: string;
  /** Most units this customer can put in the cart. */
  available: number;
  reason: "stock" | "order";
  message: string;
  at: number;
}

export function limitMessage(available: number, reason: LimitNotice["reason"]) {
  return reason === "stock"
    ? `Only ${available} unit${available === 1 ? "" : "s"} of this product ${available === 1 ? "is" : "are"} currently available in stock. If you need a larger quantity, please contact our shop.`
    : `You can order up to ${available} units of this product online. If you need a larger quantity, please contact our shop.`;
}

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number | null;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  /** Sum of items that have a confirmed price. */
  subtotal: number;
  /** True when at least one line has no confirmed price yet. */
  hasUnpriced: boolean;
  hydrated: boolean;
  /** Last add message for the live region. */
  announcement: string;
  /** Most recent successful add (drives the "Added to cart" notice; the cart no longer opens itself). */
  lastAdded: { productId: string; name: string; at: number } | null;
  /** Latest "can't add more" message (stock or per-order limit). */
  limitNotice: LimitNotice | null;
  /** Most units of a product that fit in the cart: the stock left, capped at the per-order limit. */
  maxFor: (productId: string) => number;
  /** Shows the limit message for a product (used when + is pressed at the limit). */
  notifyLimit: (productId: string) => void;
  dismissLimit: () => void;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  maxQty: number;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children, onAdd }: { children: React.ReactNode; onAdd?: () => void }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [lastAdded, setLastAdded] = useState<CartValue["lastAdded"]>(null);
  const [limitNotice, setLimitNotice] = useState<LimitNotice | null>(null);
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const { getById } = useProducts();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    dispatch({ type: "hydrate", items: loadCart() });
    setHydrated(true);
  }, []);

  // Persist + sync across tabs.
  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "magna-cart-v1") dispatch({ type: "hydrate", items: loadCart() });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const maxFor = useCallback((productId: string) => {
    const stock = getById(productId)?.stock;
    return stock == null ? MAX_QTY : Math.max(0, Math.min(MAX_QTY, stock));
  }, [getById]);
  const notifyLimit = useCallback((productId: string) => {
    const p = getById(productId);
    if (!p) return;
    const reason = p.stock != null && p.stock <= MAX_QTY ? "stock" : "order";
    const available = maxFor(productId);
    const message = limitMessage(available, reason);
    setLimitNotice({ productId, name: p.name, available, reason, message, at: Date.now() });
    setAnnouncement(message);
  }, [getById, maxFor]);
  const dismissLimit = useCallback(() => setLimitNotice(null), []);

  const add = useCallback((productId: string, quantity = 1) => {
    const p = getById(productId);
    if (!p) return;
    if (p.stock != null && p.stock <= 0) {
      setAnnouncement(`${p.name} is out of stock`);
      return;
    }
    const inCart = itemsRef.current.find((i) => i.productId === productId)?.quantity ?? 0;
    const room = maxFor(productId) - inCart;
    if (room <= 0) return notifyLimit(productId);
    dispatch({ type: "add", productId, quantity: Math.min(quantity, room) });
    setLastAdded({ productId, name: p.name, at: Date.now() });
    // After lastAdded, so the limit message wins over the "added" notice.
    if (quantity > room) notifyLimit(productId);
    else setAnnouncement(`${p.name} added to cart`);
    onAddRef.current?.();
  }, [getById, maxFor, notifyLimit]);
  /** Sets a line's quantity; asking for more than is available keeps the quantity at the limit and says why. */
  const setQuantity = useCallback((productId: string, quantity: number) => {
    const max = maxFor(productId);
    const current = itemsRef.current.find((i) => i.productId === productId)?.quantity ?? 0;
    if (quantity > max && quantity > current) {
      notifyLimit(productId);
      if (current >= max) return;
      quantity = max;
    }
    if (quantity < current) setLimitNotice((n) => (n?.productId === productId ? null : n));
    dispatch({ type: "set", productId, quantity });
  }, [maxFor, notifyLimit]);
  const remove = useCallback((productId: string) => {
    const p = getById(productId);
    dispatch({ type: "remove", productId });
    if (p) setAnnouncement(`${p.name} removed from cart`);
  }, [getById]);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartValue>(() => {
    const lines: CartLine[] = items.flatMap((i) => {
      const product = getById(i.productId);
      return product
        ? [{ product, quantity: i.quantity, lineTotal: product.priceInr != null ? product.priceInr * i.quantity : null }]
        : [];
    });
    return {
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0),
      hasUnpriced: lines.some((l) => l.lineTotal == null),
      hydrated,
      announcement,
      lastAdded,
      limitNotice,
      maxFor,
      notifyLimit,
      dismissLimit,
      add,
      setQuantity,
      remove,
      clear,
      maxQty: MAX_QTY,
    };
  }, [items, hydrated, announcement, lastAdded, limitNotice, maxFor, notifyLimit, dismissLimit, add, setQuantity, remove, clear, getById]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
