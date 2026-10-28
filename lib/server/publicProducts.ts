import "server-only";
import { products as fallbackProducts, getProduct as fallbackProduct } from "@/data/products";
import type { Product } from "@/types";
import { anonClient, supabaseConfigured } from "./supabase";

const BASE_COLUMNS = "id, name, price, stock, pack_size, tag, description, long_description, images, created_at";
const COLUMNS = `${BASE_COLUMNS}, original_price`;
/** original_price arrives with its own migration; until it's applied, read the catalogue without it. */
const missingColumn = (e: { code?: string } | null) => e?.code === "42703" || e?.code === "PGRST204";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toProduct(r: any): Product {
  const image: string | null = r.images?.[0] ?? null;
  return {
    id: r.id,
    slug: r.id,
    name: r.name,
    tag: r.tag || undefined,
    description: r.description || "",
    longDescription: r.long_description || r.description || "",
    packSize: r.pack_size || null,
    priceInr: r.price ?? null,
    originalPriceInr: r.price != null && r.original_price != null && r.original_price > r.price ? r.original_price : null,
    image,
    images: r.images ?? [],
    imageAlt: r.name,
    featured: true,
    stock: r.stock ?? 0,
  };
}

/**
 * Products shown on the storefront: only rows with visible = true (enforced by row-level security as
 * well). Falls back to the bundled catalogue only when the database can't be queried at all.
 */
export async function getPublicProducts(): Promise<Product[]> {
  if (!supabaseConfigured) return fallbackProducts;
  try {
    const query = (cols: string) =>
      anonClient().from("products").select(cols).eq("visible", true).order("created_at", { ascending: true }).order("name", { ascending: true });
    let { data, error } = await query(COLUMNS);
    if (missingColumn(error)) ({ data, error } = await query(BASE_COLUMNS));
    if (error) throw error;
    return (data ?? []).map(toProduct);
  } catch (e) {
    console.error("[products] falling back to the bundled catalogue:", (e as { message?: string })?.message);
    return fallbackProducts;
  }
}

export async function getPublicProduct(slug: string): Promise<Product | null> {
  if (!supabaseConfigured) return fallbackProduct(slug) ?? null;
  try {
    const query = (cols: string) => anonClient().from("products").select(cols).eq("id", slug).eq("visible", true).maybeSingle();
    let { data, error } = await query(COLUMNS);
    if (missingColumn(error)) ({ data, error } = await query(BASE_COLUMNS));
    if (error) throw error;
    return data ? toProduct(data) : null;
  } catch (e) {
    console.error("[products] falling back to the bundled catalogue:", (e as { message?: string })?.message);
    return fallbackProduct(slug) ?? null;
  }
}
