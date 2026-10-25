import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import About from "@/components/home/About";
import OrganicSourcing from "@/components/home/OrganicSourcing";
import WhyMagna from "@/components/home/WhyMagna";
import { ArrowIcon } from "@/components/ui/Icons";
import { story } from "@/data/brand";

export const metadata: Metadata = {
  title: "About Us | Magna Eco Bites",
  description: "Family-run from Kolathur, Chennai — traditional South Indian podis and country sugar, stone-ground in small batches.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="bg-cream pb-6 pt-12 sm:pt-16 md:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-xs text-ink/55 sm:text-sm">
            <Link href="/" className="focus-ring rounded hover:text-clay">Home</Link> <span aria-hidden="true">/</span>{" "}
            <span aria-current="page" className="text-forest">About us</span>
          </nav>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-clay sm:text-xs">About us</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight text-forest sm:text-5xl md:text-6xl">
            A little tradition. <span className="italic text-clay">A lot of flavour.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/70 sm:text-lg">{story.inspiration}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">Shop our products <ArrowIcon width={16} height={16} /></Link>
            <a href="#team" className="btn-secondary">Meet the team</a>
          </div>
        </div>
      </section>
      <div id="story">
        <About aboutLink={false} />
      </div>
      <OrganicSourcing learnMore={false} />
      <WhyMagna learnMore={false} />
    </SiteShell>
  );
}
