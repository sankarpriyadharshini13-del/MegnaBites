import Link from "next/link";
import type { Product } from "@/types";
import ProductImage from "./ProductImage";
import AddToCartButton from "./AddToCartButton";
import Price, { percentOff } from "@/components/ui/Price";
import { ArrowIcon } from "@/components/ui/Icons";

const LOW_STOCK = 10;

export function stockState(p: Product): { label: string; tone: "out" | "low" } | null {
  if (p.stock == null) return null;
  if (p.stock <= 0) return { label: "Out of stock", tone: "out" };
  if (p.stock <= LOW_STOCK) return { label: `Only ${p.stock} left`, tone: "low" };
  return null;
}

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const stock = stockState(product);
  const out = stock?.tone === "out";
  const href = `/products/${product.slug}`;
  const off = percentOff(product.priceInr, product.originalPriceInr);
  return (
    <article className="group relative flex h-full flex-col rounded-[1.5rem] bg-white p-2.5 shadow-soft ring-1 ring-forest/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-within:shadow-lift">
      <Link href={href} className="focus-ring relative block aspect-square overflow-hidden rounded-[1.1rem] bg-sand" aria-label={`View ${product.name}`}>
        <ProductImage product={product} sizes="(min-width:1280px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 80vw" priority={priority} />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {product.tag ? (
            <span className="rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-clay shadow-soft backdrop-blur">
              {product.tag}
            </span>
          ) : <span />}
          {stock ? (
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] shadow-soft ${out ? "bg-forest text-cream" : "bg-honey text-forest-deep"}`}>
              {stock.label}
            </span>
          ) : off ? (
            <span className="rounded-full bg-leaf px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cream shadow-soft">{off}% off</span>
          ) : null}
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-forest/90 px-3 py-1.5 text-xs font-semibold text-cream opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View details <ArrowIcon width={13} height={13} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
          {product.packSize ?? "Pack size to be confirmed"}
        </p>
        <h3 className="mt-1 font-display text-xl leading-tight text-forest">
          <Link href={href} className="focus-ring rounded transition-colors hover:text-clay">{product.name}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/60">{product.description}</p>
        <Link
          href={href}
          className="focus-ring mt-3 inline-flex items-center gap-1 self-start rounded text-sm font-semibold text-forest underline-offset-4 hover:text-clay hover:underline"
        >
          View details<span className="sr-only"> for {product.name}</span> <ArrowIcon width={14} height={14} />
        </Link>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-forest/[0.07] pt-4">
          <div className="min-w-0">
            <Price amount={product.priceInr} original={product.originalPriceInr} className={product.priceInr == null ? "!text-xs" : off ? "!text-[1.35rem]" : "!text-2xl"} originalClassName="text-xs" />
          </div>
          <AddToCartButton
            productId={product.id}
            name={product.name}
            disabled={out}
            compact
            className="!min-h-10 shrink-0 !px-4 !text-sm !shadow-none hover:!translate-y-0"
            stepperClassName="shrink-0"
          />
        </div>
      </div>
    </article>
  );
}
