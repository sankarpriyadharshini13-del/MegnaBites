import type { Metadata } from "next";
import dynamic from "next/dynamic";
import SiteShell from "@/components/layout/SiteShell";
import { products } from "@/data/products";

const ProductCard = dynamic(() => import("@/components/product/ProductCard"), {
  loading: () => <div className="aspect-[4/5] rounded-[2rem] bg-sand animate-pulse" />
});

export const metadata: Metadata = { title: "Shop | Magna Eco Bites", description: "Idli podi, country sugar and moringa idli podi from Magna Eco Bites, Kolathur, Chennai." };

export default function ShopPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 md:py-20 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">Shop</p>
        <h1 className="mt-2 font-display text-3xl text-forest sm:mt-3 sm:text-4xl md:text-6xl">All <span className="italic text-clay">products</span></h1>
        <ul className="mt-8 grid gap-5 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (<li key={p.id}><ProductCard product={p} priority={i < 3} /></li>))}
        </ul>
      </section>
    </SiteShell>
  );
}
