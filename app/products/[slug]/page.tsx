import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import SiteShell from "@/components/layout/SiteShell";
import ProductCard, { stockState } from "@/components/product/ProductCard";
import { ArrowIcon, LeafIcon, PinIcon, StoneIcon } from "@/components/ui/Icons";
import { servingIdeas } from "@/data/brand";
import { recommend } from "@/lib/recommend";
import { getPublicProduct, getPublicProducts } from "@/lib/server/publicProducts";

const ProductGallery = nextDynamic(() => import("@/components/product/ProductGallery"), {
  loading: () => <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-sand" />,
});
const AddToCartPanel = nextDynamic(() => import("@/components/home/AddToCartPanel"), {
  loading: () => <div className="h-24 animate-pulse rounded-2xl bg-sand" />,
});
const Price = nextDynamic(() => import("@/components/ui/Price"));

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPublicProduct(params.slug);
  return p ? { title: `${p.name} | Magna Eco Bites`, description: p.description } : {};
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, catalogue] = await Promise.all([getPublicProduct(params.slug), getPublicProducts()]);
  if (!product) notFound();
  const related = recommend(product, catalogue, 3);
  const idea = servingIdeas.find((s) => s.productSlug === product.id);
  const stock = stockState(product);
  const out = stock?.tone === "out";

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-ink/55 sm:text-sm">
          <Link href="/" className="focus-ring rounded hover:text-clay">Home</Link> <span aria-hidden="true">/</span>{" "}
          <Link href="/shop" className="focus-ring rounded hover:text-clay">Shop</Link> <span aria-hidden="true">/</span>{" "}
          <span aria-current="page" className="text-forest">{product.name}</span>
        </nav>

        <div className="mt-6 grid items-start gap-8 sm:mt-8 lg:grid-cols-2 lg:gap-16">
          <ProductGallery product={product} />

          <div className="lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-2">
              {product.tag && <span className="rounded-full bg-clay/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-clay">{product.tag}</span>}
              {stock && (
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${out ? "bg-forest text-cream" : "bg-honey/30 text-forest-deep"}`}>
                  {out ? "Currently out of stock" : stock.label}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl md:text-5xl">{product.name}</h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50 sm:text-xs">{product.packSize ?? "Pack size to be confirmed"}</p>
            <div className="mt-5"><Price amount={product.priceInr} className="!text-3xl sm:!text-4xl" /></div>
            <p className="mt-5 text-base leading-relaxed text-ink/70 sm:text-lg">{product.longDescription}</p>
            <div className="mt-7"><AddToCartPanel productId={product.id} name={product.name} disabled={out} /></div>

            <ul className="mt-8 grid gap-3 border-t border-forest/10 pt-6 sm:grid-cols-2">
              <li className="flex items-center gap-3 text-sm text-ink/70"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-leaf/10 text-leaf"><PinIcon width={18} height={18} /></span>Sourced &amp; packed in Kolathur, Chennai</li>
              <li className="flex items-center gap-3 text-sm text-ink/70"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-leaf/10 text-leaf"><StoneIcon width={18} height={18} /></span>Stone-ground in small batches</li>
            </ul>
            <Link href="/about" className="focus-ring mt-5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-forest underline-offset-4 hover:text-clay hover:underline">
              Learn more about how we make it <ArrowIcon width={15} height={15} />
            </Link>
          </div>
        </div>

        {idea && (
          <section aria-labelledby="serve-title" className="mt-14 rounded-[1.75rem] bg-sand/50 p-6 sm:mt-20 sm:p-10">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-clay sm:text-xs"><LeafIcon width={14} height={14} /> Serving idea</p>
            <h2 id="serve-title" className="mt-2 font-display text-2xl text-forest sm:text-3xl">{idea.dish}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">{idea.summary}</p>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {idea.steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-white/80 p-4 text-sm leading-relaxed text-ink/75">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-xs font-bold text-cream">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-14 sm:mt-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-clay sm:text-xs">Recommended products</p>
                <h2 id="related-title" className="mt-2 font-display text-3xl text-forest sm:text-4xl">You may <span className="italic text-clay">also like</span></h2>
              </div>
              <Link href="/shop" className="focus-ring group inline-flex items-center gap-2 self-start rounded-full border border-forest/15 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream sm:self-auto">
                View all products <ArrowIcon width={16} height={16} />
              </Link>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}><ProductCard product={p} /></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
