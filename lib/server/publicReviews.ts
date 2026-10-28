import "server-only";
import { anonClient, supabaseConfigured } from "./supabase";

export interface PublicReview {
  id: string;
  /** First name + last initial, e.g. "Asha K." (formatted by the database). */
  name: string;
  rating: number;
  message: string;
  products: string;
  createdAt: string;
}

export interface ReviewStats {
  total: number;
  /** One decimal, 0 when there are no live reviews. */
  average: number;
  /** Count per star: index 0 = 5 stars … index 4 = 1 star. */
  distribution: [number, number, number, number, number];
}

export interface ReviewPage {
  reviews: PublicReview[];
  hasMore: boolean;
}

export const EMPTY_STATS: ReviewStats = { total: 0, average: 0, distribution: [0, 0, 0, 0, 0] };

/* eslint-disable @typescript-eslint/no-explicit-any */
const toReview = (r: any): PublicReview => ({
  id: r.id,
  name: r.name || "Customer",
  rating: Math.min(5, Math.max(1, Number(r.rating) || 0)),
  message: r.message ?? "",
  products: r.products ?? "",
  createdAt: r.created_at,
});

/** published_review_stats / published_reviews_page arrive with their own migration. */
const missingFn = (e: { code?: string } | null) => ["PGRST202", "42883"].includes(e?.code ?? "");

/** Fallback before 20261031000000_review_listing.sql: the newest 50 live reviews via published_reviews(). */
async function newest50(): Promise<PublicReview[]> {
  const { data, error } = await anonClient().rpc("published_reviews", { p_limit: 50 });
  if (error) throw error;
  return ((data ?? []) as any[]).map(toReview);
}

function statsOf(list: PublicReview[]): ReviewStats {
  const distribution: ReviewStats["distribution"] = [0, 0, 0, 0, 0];
  for (const r of list) distribution[5 - r.rating]++;
  const total = list.length;
  const average = total ? Math.round((list.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
  return { total, average, distribution };
}

const log = (e: unknown) => console.error("[reviews] couldn't load published reviews:", (e as { message?: string })?.message);

/** Summary of the reviews that are "Live on website" (Admin → Reviews). Empty on any error. */
export async function getReviewStats(): Promise<ReviewStats> {
  if (!supabaseConfigured) return EMPTY_STATS;
  try {
    const { data, error } = await anonClient().rpc("published_review_stats");
    if (missingFn(error)) return statsOf(await newest50());
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as any;
    if (!row) return EMPTY_STATS;
    return {
      total: Number(row.total) || 0,
      average: Number(row.average) || 0,
      distribution: [row.r5, row.r4, row.r3, row.r2, row.r1].map((n: unknown) => Number(n) || 0) as ReviewStats["distribution"],
    };
  } catch (e) {
    log(e);
    return EMPTY_STATS;
  }
}

/** One page of live reviews, newest first. `rating` limits it to one star value. Empty on any error. */
export async function getReviewsPage({ limit = 12, offset = 0, rating = null }: { limit?: number; offset?: number; rating?: number | null } = {}): Promise<ReviewPage> {
  if (!supabaseConfigured) return { reviews: [], hasMore: false };
  limit = Math.min(Math.max(1, Math.floor(limit)), 49);
  offset = Math.max(0, Math.floor(offset));
  try {
    // Ask for one extra row to know whether there's another page.
    const { data, error } = await anonClient().rpc("published_reviews_page", { p_limit: limit + 1, p_offset: offset, p_rating: rating });
    let rows: PublicReview[];
    if (missingFn(error)) {
      rows = (await newest50()).filter((r) => rating == null || r.rating === rating).slice(offset, offset + limit + 1);
    } else {
      if (error) throw error;
      rows = ((data ?? []) as any[]).map(toReview);
    }
    return { reviews: rows.slice(0, limit), hasMore: rows.length > limit };
  } catch (e) {
    log(e);
    return { reviews: [], hasMore: false };
  }
}
