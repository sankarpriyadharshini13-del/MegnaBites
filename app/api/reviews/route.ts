import { HttpError, dbError, handle, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/guard";
import { int, str } from "@/lib/server/model";
import { getReviewsPage } from "@/lib/server/publicReviews";

export const dynamic = "force-dynamic";

/** Public: one page of the reviews switched "Live on website" (?offset=0&limit=12&rating=5). */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : null);
  const rating = num(q.get("rating"));
  return json(
    await getReviewsPage({
      offset: num(q.get("offset")) ?? 0,
      limit: num(q.get("limit")) ?? 12,
      rating: rating != null && rating >= 1 && rating <= 5 ? rating : null,
    }),
  );
});

/**
 * A customer reviews one of their own orders (1–5 stars + optional message). Inserted with the
 * customer's session: row-level security and a trigger enforce ownership, one review per order and
 * the reviewer's name.
 */
export const POST = handle(async (req) => {
  const { client } = await requireUser(req);
  const body = await readJson(req, 5000);
  const orderNumber = int(body.orderNumber, "Order", 1, Number.MAX_SAFE_INTEGER);
  const rating = int(body.rating, "Rating", 1, 5);
  const message = str(body.message, "Review", 1000);
  const { data, error } = await client
    .from("reviews")
    .insert({ order_number: orderNumber, rating, message })
    .select("rating, message, created_at")
    .single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "You've already reviewed this order. Thank you!");
    if (error.code === "42501") throw new HttpError(403, "You can only review your own orders.");
    throw dbError(error);
  }
  return json({ review: { rating: data.rating, message: data.message, createdAt: data.created_at } }, 201);
});
