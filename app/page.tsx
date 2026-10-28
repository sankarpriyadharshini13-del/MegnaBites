import dynamic from "next/dynamic";
import SiteShell from "@/components/layout/SiteShell";
import Reviews from "@/components/home/Reviews";
import { getReviewStats, getReviewsPage } from "@/lib/server/publicReviews";

const Hero = dynamic(() => import("@/components/home/Hero"), { loading: () => <div className="h-screen bg-cream" /> });
const FeaturedProducts = dynamic(() => import("@/components/home/FeaturedProducts"), { loading: () => <div className="h-96 bg-cream" /> });
const ProductUsage = dynamic(() => import("@/components/home/ProductUsage"), { loading: () => <div className="h-96 bg-cream" /> });
const OrganicSourcing = dynamic(() => import("@/components/home/OrganicSourcing"), { loading: () => <div className="h-96 bg-cream" /> });
const WhyMagna = dynamic(() => import("@/components/home/WhyMagna"), { loading: () => <div className="h-96 bg-cream" /> });
const About = dynamic(() => import("@/components/home/About"), { loading: () => <div className="h-96 bg-cream" /> });
const FAQ = dynamic(() => import("@/components/home/FAQ"), { loading: () => <div className="h-96 bg-cream" /> });
const Contact = dynamic(() => import("@/components/home/Contact"), { loading: () => <div className="h-96 bg-cream" /> });

export default async function Home() {
  // The Reviews section appears only while at least one review is "Live on website" (Admin → Reviews).
  const [{ reviews }, reviewStats] = await Promise.all([getReviewsPage({ limit: 8 }), getReviewStats()]);
  return (
    <SiteShell>
      <Hero />
      <FeaturedProducts />
      <ProductUsage />
      <Reviews reviews={reviews} stats={reviewStats} />
      <OrganicSourcing />
      <WhyMagna />
      <About />
      <FAQ />
      <Contact />
    </SiteShell>
  );
}
