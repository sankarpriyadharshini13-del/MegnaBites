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
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const { getById } = useProducts();

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

  const add = useCallback((productId: string, quantity = 1) => {
    const p = getById(productId);
    if (!p) return;
    if (p.stock != null && p.stock <= 0) {
      setAnnouncement(`${p.name} is out of stock`);
      return;
    }
    dispatch({ type: "add", productId, quantity });
    setAnnouncement(`${p.name} added to cart`);
    onAddRef.current?.();
  }, [getById]);
  const setQuantity = useCallback((productId: string, quantity: number) => dispatch({ type: "set", productId, quantity }), []);
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
      add,
      setQuantity,
      remove,
      clear,
      maxQty: MAX_QTY,
    };
  }, [items, hydrated, announcement, add, setQuantity, remove, clear, getById]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
