import "server-only";
import { products as fallbackProducts, getProduct as fallbackProduct } from "@/data/products";
import type { Product } from "@/types";
import { anonClient, supabaseConfigured } from "./supabase";

const COLUMNS = "id, name, price, stock, pack_size, tag, description, long_description, images, created_at";

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
    const { data, error } = await anonClient()
      .from("products")
      .select(COLUMNS)
      .eq("visible", true)
      .order("created_at", { ascending: true })
      .order("name", { ascending: true });
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
    const { data, error } = await anonClient().from("products").select(COLUMNS).eq("id", slug).eq("visible", true).maybeSingle();
    if (error) throw error;
    return data ? toProduct(data) : null;
  } catch (e) {
    console.error("[products] falling back to the bundled catalogue:", (e as { message?: string })?.message);
    return fallbackProduct(slug) ?? null;
  }
}
