"use client";

import { ReviewStars } from "./ReviewCard";

export interface RatingStats {
  total: number;
  average: number;
  /** index 0 = 5 stars … index 4 = 1 star */
  distribution: number[];
}

/**
 * Average + per-star bars for the reviews shown on the site. With `onSelect`, each bar becomes a filter
 * button (used on /reviews); without it the bars are plain.
 */
export default function RatingSummary({
  stats,
  active = null,
  onSelect,
  className = "",
}: {
  stats: RatingStats;
  active?: number | null;
  onSelect?: (rating: number | null) => void;
  className?: string;
}) {
  const max = Math.max(1, ...stats.distribution);
  return (
    <div className={className}>
      <div className="flex items-end gap-3">
        <span className="font-display text-5xl leading-none text-forest">{stats.average.toFixed(1)}</span>
        <span className="pb-1">
          <ReviewStars value={Math.round(stats.average)} size={18} />
          <span className="mt-1 block text-xs text-ink/55">
            from {stats.total} review{stats.total === 1 ? "" : "s"} on our site
          </span>
        </span>
      </div>
      <ul className="mt-5 space-y-1" aria-label="Reviews by star rating">
        {stats.distribution.map((count, i) => {
          const stars = 5 - i;
          const on = active === stars;
          const row = (
            <>
              <span className="w-8 shrink-0 text-left text-xs font-semibold text-forest">{stars} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-forest/[0.08]">
                <span className="block h-full rounded-full bg-honey" style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className="w-7 shrink-0 text-right text-xs tabular-nums text-ink/55">{count}</span>
            </>
          );
          return (
            <li key={stars}>
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${stars} star reviews: ${count}`}
                  disabled={!count && !on}
                  onClick={() => onSelect(on ? null : stars)}
                  className={`focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors disabled:cursor-default disabled:opacity-45 ${on ? "bg-honey/20" : "hover:bg-sand/70"}`}
                >
                  {row}
                </button>
              ) : (
                <div className="flex items-center gap-3 px-2 py-1" aria-label={`${stars} star reviews: ${count}`}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
