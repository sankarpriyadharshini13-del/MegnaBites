import { useMemo } from "react";
import { products } from "@/data/products";

export function useProductSearch(query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    const terms = q.split(/\s+/);
    return products.filter((p) => {
      const hay = `${p.name} ${p.description} ${p.tag ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query]);
}
