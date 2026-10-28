"use client";

import { useRef, useState } from "react";
import RatingSummary, { type RatingStats } from "./RatingSummary";
import ReviewCard, { type ReviewCardData } from "./ReviewCard";

const PAGE = 12;

/** /reviews: rating summary that filters by stars, a masonry grid of reviews and "Load more". */
export default function ReviewsBrowser({
  stats,
  initial,
  initialHasMore,
}: {
  stats: RatingStats;
  initial: ReviewCardData[];
  initialHasMore: boolean;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  /** True while a star filter reloads the list (vs. "Load more" appending). */
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);

  const load = async (nextRating: number | null, offset: number) => {
    const id = ++request.current;
    setLoading(true);
    setReplacing(offset === 0);
    setError("");
    try {
      const q = new URLSearchParams({ offset: String(offset), limit: String(PAGE) });
      if (nextRating) q.set("rating", String(nextRating));
      const res = await fetch(`/api/reviews?${q}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { reviews: ReviewCardData[]; hasMore: boolean };
      if (id !== request.current) return; // a newer filter click won
      setItems((prev) => (offset ? [...prev, ...body.reviews.filter((r) => !prev.some((p) => p.id === r.id))] : body.reviews));
      setHasMore(body.hasMore);
    } catch {
      if (id === request.current) setError("Reviews couldn't be loaded. Please try again.");
    } finally {
      if (id === request.current) setLoading(false);
    }
  };

  const choose = (r: number | null) => {
    setRating(r);
    load(r, 0);
  };

  const shownTotal = rating ? stats.distribution[5 - rating] : stats.total;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-soft ring-1 ring-forest/[0.06] sm:p-6 lg:sticky lg:top-28">
          <RatingSummary stats={stats} active={rating} onSelect={choose} />
          <p className="mt-4 text-xs text-ink/50">Tap a star rating to filter.</p>
        </div>
      </aside>

      <div className="min-w-0 lg:col-span-8 xl:col-span-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/60" role="status" aria-live="polite">
            {loading && !items.length ? "Loading reviews…" : `Showing ${items.length} of ${shownTotal} ${rating ? `${rating}-star ` : ""}review${shownTotal === 1 ? "" : "s"}`}
          </p>
          {rating && (
            <button type="button" onClick={() => choose(null)} className="focus-ring rounded-full border border-forest/15 bg-white px-4 py-1.5 text-sm font-semibold text-forest hover:border-forest">
              {rating} ★ only <span aria-hidden="true" className="ml-1 text-ink/45">×</span>
              <span className="sr-only"> — show all ratings</span>
            </button>
          )}
        </div>

        {items.length === 0 && !loading ? (
          <p className="rounded-[1.5rem] bg-white/70 p-10 text-center text-ink/60">{error || "No reviews with this rating yet."}</p>
        ) : (
          // CSS columns let short and long reviews pack neatly without big gaps.
          <ul className={`gap-5 sm:columns-2 xl:columns-3 transition-opacity ${loading && replacing ? "opacity-50" : ""}`}>
            {items.map((r) => (
              <li key={r.id} className="mb-5 break-inside-avoid">
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        )}

        {error && items.length > 0 && <p role="alert" className="mt-4 text-center text-sm font-medium text-clay">{error}</p>}
        {hasMore && (
          <div className="mt-4 text-center">
            <button type="button" className="btn-secondary min-w-48 disabled:opacity-60" disabled={loading} onClick={() => load(rating, items.length)}>
              {loading && !replacing ? "Loading…" : "Load more reviews"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
