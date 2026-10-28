import Link from "next/link";
import type { PublicReview, ReviewStats } from "@/lib/server/publicReviews";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import { ArrowIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";

/**
 * Home page Reviews section, shown only while at least one review is "Live on website" (Admin → Reviews).
 * A rating summary on the left and the latest reviews in a swipeable row on the right keep it compact no
 * matter how many reviews there are; every review is on /reviews.
 */
export default function Reviews({ reviews, stats }: { reviews: PublicReview[]; stats: ReviewStats }) {
  if (!reviews.length) return null;
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative overflow-hidden bg-sand/40 py-16 md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-honey/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="min-w-0 lg:col-span-4">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-clay sm:text-xs">
              <span aria-hidden="true" className="h-px w-6 bg-clay/60" />
              Customer reviews
            </p>
            <h2 id="reviews-title" className="mt-3 font-display text-[2rem] leading-[1.1] tracking-tight text-forest sm:text-4xl md:text-5xl">
              What our customers <span className="italic text-clay">say</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/65">Shared by customers after ordering from our shop.</p>

            <RatingSummary stats={stats} className="mt-8 rounded-[1.5rem] bg-white/80 p-5 shadow-soft ring-1 ring-forest/[0.06] sm:p-6" />

            <Link
              href="/reviews"
              className="focus-ring group mt-6 inline-flex items-center gap-2 rounded-full border border-forest/15 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
            >
              {stats.total > reviews.length ? `See all ${stats.total} reviews` : "See all reviews"}
              <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <Reveal delay={120} className="min-w-0 lg:col-span-8 lg:pt-2">
            <ReviewCarousel reviews={reviews} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
