"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/Icons";
import ReviewCard, { type ReviewCardData } from "./ReviewCard";

/**
 * Horizontal, swipeable row of review cards: about 1 card on phones, 2 on tablets and desktop.
 * Arrow buttons and a progress bar appear only when there's more than fits.
 */
export default function ReviewCarousel({ reviews }: { reviews: ReviewCardData[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ start: true, end: true, progress: 1 });
  // Card the arrows are heading to; cleared once scrolling settles, so quick repeated clicks add up.
  const target = useRef<number | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>();

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPos({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft >= max - 4,
      progress: max <= 4 ? 1 : (el.scrollLeft + el.clientWidth) / el.scrollWidth,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, reviews.length]);

  const onScroll = () => {
    measure();
    clearTimeout(settle.current);
    settle.current = setTimeout(() => (target.current = null), 200);
  };

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth;
    const last = Math.ceil((el.scrollWidth - el.clientWidth) / step);
    const index = Math.max(0, Math.min(last, (target.current ?? Math.round(el.scrollLeft / step)) + dir));
    target.current = index;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => (target.current = null), 900);
    el.scrollTo({ left: Math.min(index * step, el.scrollWidth - el.clientWidth), behavior: "smooth" });
  };

  const scrollable = !(pos.start && pos.end);
  const btn =
    "focus-ring grid h-11 w-11 place-items-center rounded-full border border-forest/15 bg-white text-forest shadow-soft transition-colors hover:border-forest hover:bg-forest hover:text-cream disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className="min-w-0">
      <ul
        ref={track}
        onScroll={onScroll}
        aria-label="Latest customer reviews"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 pt-1 sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {reviews.map((r) => (
          <li key={r.id} className={`shrink-0 snap-start ${reviews.length === 1 ? "w-full" : "w-[86%] sm:w-[calc(50%-10px)]"}`}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>

      {scrollable && (
        <div className="mt-6 flex items-center gap-4">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-forest/10" aria-hidden="true">
            <div className="h-full rounded-full bg-forest transition-[width] duration-300" style={{ width: `${Math.max(8, pos.progress * 100)}%` }} />
          </div>
          <div className="flex gap-2">
            <button type="button" className={btn} onClick={() => go(-1)} disabled={pos.start} aria-label="Previous reviews">
              <ArrowIcon width={18} height={18} className="rotate-180" />
            </button>
            <button type="button" className={btn} onClick={() => go(1)} disabled={pos.end} aria-label="More reviews">
              <ArrowIcon width={18} height={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
