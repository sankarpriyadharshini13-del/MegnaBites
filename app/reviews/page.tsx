import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import ReviewsBrowser from "@/components/reviews/ReviewsBrowser";
import { getReviewStats, getReviewsPage } from "@/lib/server/publicReviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer reviews | Magna Eco Bites",
  description: "Reviews shared by Magna Eco Bites customers after ordering from our shop.",
};

export default async function ReviewsPage() {
  const [page, stats] = await Promise.all([getReviewsPage({ limit: 12 }), getReviewStats()]);
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:py-16 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-ink/55 sm:text-sm">
          <Link href="/" className="focus-ring rounded hover:text-clay">Home</Link> <span aria-hidden="true">/</span>{" "}
          <span aria-current="page" className="text-forest">Reviews</span>
        </nav>
        <p className="mt-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-clay sm:text-xs">
          <span aria-hidden="true" className="h-px w-6 bg-clay/60" />
          Customer reviews
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl md:text-5xl">
          What our customers <span className="italic text-clay">say</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/65">Shared by customers after ordering from our shop.</p>

        <div className="mt-8 sm:mt-10">
          {stats.total === 0 ? (
            <div className="rounded-[1.5rem] bg-sand/60 p-10 text-center">
              <p className="text-ink/65">No reviews to show yet.</p>
              <Link href="/shop" className="btn-primary mt-5">Browse the shop</Link>
            </div>
          ) : (
            <ReviewsBrowser stats={stats} initial={page.reviews} initialHasMore={page.hasMore} />
          )}
        </div>
      </div>
    </SiteShell>
  );
}
