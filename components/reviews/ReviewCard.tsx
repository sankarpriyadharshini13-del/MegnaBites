"use client";

import { useId, useState } from "react";

export interface ReviewCardData {
  id: string;
  name: string;
  rating: number;
  message: string;
  products: string;
  createdAt: string;
}

const STAR = "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z";
/** Messages longer than this start collapsed to a few lines with "Read more". */
const LONG = 180;

export function ReviewStars({ value, size = 16, className = "" }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 text-honey ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

export const monthYear = (iso: string) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(iso));

/** One customer review: stars, message (collapsible when long), reviewer and the products they ordered. */
export default function ReviewCard({ review: r }: { review: ReviewCardData }) {
  const [open, setOpen] = useState(false);
  const textId = useId();
  const long = r.message.length > LONG;
  const products = r.products ? r.products.split(", ").filter(Boolean) : [];

  return (
    <figure className="flex h-full flex-col rounded-[1.5rem] bg-white p-5 shadow-soft ring-1 ring-forest/[0.06] transition-shadow hover:shadow-lift sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <ReviewStars value={r.rating} />
        <time dateTime={r.createdAt} className="text-xs text-ink/45">{monthYear(r.createdAt)}</time>
      </div>

      <blockquote className="mt-4 flex-1">
        {r.message ? (
          <>
            <p id={textId} className={`whitespace-pre-line text-[15px] leading-relaxed text-ink/75 [overflow-wrap:anywhere] ${long && !open ? "line-clamp-5" : ""}`}>
              {r.message}
            </p>
            {long && (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={textId}
                onClick={() => setOpen((o) => !o)}
                className="focus-ring mt-2 rounded text-sm font-semibold text-forest underline-offset-4 hover:text-clay hover:underline"
              >
                {open ? "Show less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <p className="text-[15px] italic text-ink/50">Rated {r.rating} out of 5.</p>
        )}
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-forest/[0.07] pt-4">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest font-display text-base text-cream">
          {r.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-forest">{r.name}</span>
          <span className="flex items-center gap-1 text-xs text-leaf">
            <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            Verified purchase
          </span>
        </span>
      </figcaption>
      {products.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5" aria-label="Products ordered">
          {products.slice(0, 2).map((p) => (
            <span key={p} className="max-w-full truncate rounded-full bg-sand/70 px-2.5 py-1 text-[11px] font-semibold text-forest/80">{p}</span>
          ))}
          {products.length > 2 && (
            <span className="rounded-full bg-sand/70 px-2.5 py-1 text-[11px] font-semibold text-forest/60" title={products.slice(2).join(", ")}>+{products.length - 2} more</span>
          )}
        </p>
      )}
    </figure>
  );
}
