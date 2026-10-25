"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types";

interface ProductsValue {
  products: Product[];
  getById: (id: string) => Product | undefined;
  refresh: () => Promise<void>;
}

const ProductsContext = createContext<ProductsValue | null>(null);

const POLL_MS = 30_000;

/**
 * Storefront catalogue. The layout renders it from the database on the server; this provider keeps it
 * fresh on the client (route changes, tab focus and a light poll) so edits made in the admin panel show
 * up without any code change or manual reload.
 */
export function ProductsProvider({ initial, children }: { initial: Product[]; children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initial);
  const inFlight = useRef(false);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { products?: Product[] };
      if (Array.isArray(body.products)) setProducts(body.products);
    } catch {
      /* offline — keep showing the last known catalogue */
    } finally {
      inFlight.current = false;
    }
  }, []);

  // Re-read on every client-side navigation (e.g. returning from the admin panel).
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(onVisible, POLL_MS);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [refresh]);

  const value = useMemo<ProductsValue>(
    () => ({ products, getById: (id) => products.find((p) => p.id === id), refresh }),
    [products, refresh],
  );
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
  return ctx;
}
