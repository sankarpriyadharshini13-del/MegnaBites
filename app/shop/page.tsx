import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import SiteShell from "@/components/layout/SiteShell";
import { getPublicProducts } from "@/lib/server/publicProducts";

const ProductCard = nextDynamic(() => import("@/components/product/ProductCard"), {
  loading: () => <div className="aspect-[4/5] rounded-[2rem] bg-sand animate-pulse" />
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop | Magna Eco Bites", description: "Idli podi, country sugar and moringa idli podi from Magna Eco Bites, Kolathur, Chennai." };

export default async function ShopPage() {
  const products = await getPublicProducts();
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 md:py-20 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">Shop</p>
        <h1 className="mt-2 font-display text-3xl text-forest sm:mt-3 sm:text-4xl md:text-6xl">All <span className="italic text-clay">products</span></h1>
        {products.length === 0 ? (
          <p className="mt-8 rounded-[1.5rem] bg-sand/60 p-8 text-center text-ink/65 sm:mt-12">Our new batch is being packed — check back very soon.</p>
        ) : (
          <ul className="mt-8 grid gap-5 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (<li key={p.id}><ProductCard product={p} priority={i < 3} /></li>))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
