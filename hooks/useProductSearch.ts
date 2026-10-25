import { useMemo } from "react";
import { useProducts } from "@/context/ProductsContext";

export function useProductSearch(query: string) {
  const { products } = useProducts();
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    const terms = q.split(/\s+/);
    return products.filter((p) => {
      const hay = `${p.name} ${p.description} ${p.tag ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query, products]);
}
