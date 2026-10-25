"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ArrowIcon } from "@/components/ui/Icons";
import { useProducts } from "@/context/ProductsContext";
import Reveal from "./Reveal";

export default function FeaturedProducts() {
  const { products } = useProducts();
  const [tag, setTag] = useState<string>("All");

  // Filter chips come from the tags set in Admin → Products, so they change with the catalogue.
  // Tags are matched case-insensitively ("Bestseller" and "BestSeller" are one chip).
  const key = (t?: string) => (t ?? "").trim().toLowerCase();
  const tags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) if (key(p.tag) && !seen.has(key(p.tag))) seen.set(key(p.tag), p.tag!.trim());
    return Array.from(seen.values());
  }, [products]);
  const active = tags.some((t) => key(t) === key(tag)) ? tag : "All";
  const matches = (p: (typeof products)[number], t: string) => t === "All" || key(p.tag) === key(t);
  const items = products.filter((p) => matches(p, active));

  return (
    <section id="featured" aria-labelledby="featured-title" className="relative overflow-hidden bg-cream py-16 md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 h-80 w-80 rounded-full bg-honey/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="min-w-0 lg:col-span-7">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-clay sm:text-xs">
                <span aria-hidden="true" className="h-px w-6 bg-clay/60" />
                Our Shop
              </p>
              <h2 id="featured-title" className="mt-3 font-display text-[2rem] leading-[1.1] tracking-tight text-forest sm:text-4xl md:text-5xl">
                Straight from our kitchen, <span className="italic text-clay">to yours</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/65 sm:text-lg">
                Stone-ground in small batches in Kolathur, Chennai — pick a favourite or try them all.
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:items-end">
              {tags.length > 1 && (
                <div role="tablist" aria-label="Filter products" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 lg:justify-end">
                  {["All", ...tags].map((t) => {
                    const on = t === active;
                    const count = products.filter((p) => matches(p, t)).length;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setTag(t)}
                        className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                          on ? "border-forest bg-forest text-cream" : "border-forest/15 bg-white/70 text-forest hover:border-forest"
                        }`}
                      >
                        {t} <span className={on ? "text-cream/60" : "text-ink/40"}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {items.length === 0 ? (
          <p className="mt-10 rounded-[1.75rem] bg-sand/60 p-10 text-center text-ink/65">Our new batch is being packed — check back very soon.</p>
        ) : (
          <ul
            aria-label={`${active === "All" ? "All" : active} products`}
            className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4"
          >
            {items.map((p, i) => (
              <li key={p.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <Reveal delay={Math.min(i, 5) * 80} className="h-full"><ProductCard product={p} /></Reveal>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] bg-forest px-6 py-5 text-cream sm:mt-12 sm:flex-row sm:px-8">
          <p className="text-center text-sm text-cream/80 sm:text-left sm:text-base">
            <span className="font-display text-lg text-cream">{products.length} product{products.length === 1 ? "" : "s"}</span> — sourced, stone-ground and packed in our own kitchen.
          </p>
          <Link href="/shop" className="focus-ring group inline-flex shrink-0 items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-honey">
            View all products <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
