import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import SiteShell from "@/components/layout/SiteShell";
import { getProduct, products } from "@/data/products";

const ProductImage = dynamic(() => import("@/components/product/ProductImage"), {
  loading: () => <div className="aspect-[4/5] rounded-[2.5rem] bg-sand animate-pulse" />
});
const AddToCartPanel = dynamic(() => import("@/components/home/AddToCartPanel"), {
  loading: () => <div className="h-24 bg-sand animate-pulse rounded-2xl" />
});
const Price = dynamic(() => import("@/components/ui/Price"));

export const dynamicParams = false;
export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getProduct(params.slug);
  return p ? { title: `${p.name} | Magna Eco Bites`, description: p.description } : {};
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-16 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-ink/55 sm:text-sm">
          <Link href="/shop" className="focus-ring rounded hover:text-clay">Shop</Link> <span aria-hidden="true">/</span> <span aria-current="page" className="text-forest">{product.name}</span>
        </nav>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-16 sm:mt-8">
          <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-sand shadow-lift sm:rounded-[2rem] lg:rounded-[2.5rem]">
            <ProductImage product={product} sizes="(min-width:1024px) 45vw, 92vw" priority />
          </div>
          <div>
            {product.tag && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">{product.tag}</p>}
            <h1 className="mt-2 font-display text-3xl text-forest sm:text-4xl md:text-5xl">{product.name}</h1>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50 sm:text-xs">{product.packSize ?? "Pack size to be confirmed"}</p>
            <div className="mt-4"><Price amount={product.priceInr} className="!text-2xl sm:!text-3xl" /></div>
            <p className="mt-5 text-base leading-relaxed text-ink/70 sm:mt-6 sm:text-lg">{product.longDescription}</p>
            <div className="mt-6"><AddToCartPanel productId={product.id} name={product.name} /></div>
            <p className="mt-5 text-xs text-ink/55 sm:mt-6 sm:text-sm">Sourced, ground &amp; packed in Kolathur, Chennai.</p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
