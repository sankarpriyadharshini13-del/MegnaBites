import Link from "next/link";
import type { Product } from "@/types";
import ProductImage from "./ProductImage";
import AddToCartButton from "./AddToCartButton";
import Price from "@/components/ui/Price";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-leaf/10 bg-white/55 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-within:shadow-lift sm:rounded-[2rem]">
      <Link href={`/products/${product.slug}`} className="focus-ring relative block aspect-[4/5] overflow-hidden bg-sand" aria-label={`View ${product.name}`}>
        <ProductImage product={product} sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw" priority={priority} />
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-clay shadow-soft sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[11px]">
            {product.tag}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <h3 className="font-display text-xl text-forest sm:text-2xl">
          <Link href={`/products/${product.slug}`} className="focus-ring rounded hover:text-clay">{product.name}</Link>
        </h3>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50 sm:text-xs">
          {product.packSize ?? "Pack size to be confirmed"}
        </p>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink/70 sm:mt-3 sm:text-[15px]">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 sm:mt-5">
          <Price amount={product.priceInr} />
          <Link href={`/products/${product.slug}`} className="focus-ring rounded text-xs font-semibold text-forest underline-offset-4 hover:text-clay hover:underline sm:text-sm">
            View details<span className="sr-only"> for {product.name}</span>
          </Link>
        </div>
        <AddToCartButton productId={product.id} name={product.name} className="mt-3 w-full text-sm sm:mt-4 sm:text-[15px]" />
      </div>
    </article>
  );
}
