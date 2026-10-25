import type { Product } from "@/types";

const STOP = new Set(["the", "and", "with", "of", "a", "g", "kg"]);
const words = (s: string) =>
  new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)));

/**
 * Picks products to suggest under a product page: shared name words first (e.g. "Idli Podi" ↔
 * "Moringa Idli Podi"), then the same tag, then whatever is in stock. Works on whatever is in the
 * catalogue, so new products join the suggestions automatically.
 */
export function recommend(current: Product, all: Product[], limit = 3): Product[] {
  const mine = words(current.name);
  return all
    .filter((p) => p.id !== current.id)
    .map((p, index) => {
      let score = 0;
      for (const w of words(p.name)) if (mine.has(w)) score += 3;
      if (current.tag && p.tag && current.tag.toLowerCase() === p.tag.toLowerCase()) score += 2;
      if (p.stock == null || p.stock > 0) score += 1;
      return { p, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.p);
}
