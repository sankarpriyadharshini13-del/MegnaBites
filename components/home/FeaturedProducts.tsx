import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { featuredProducts } from "@/data/products";
import Reveal from "./Reveal";
import { ArrowIcon } from "@/components/ui/Icons";

export default function FeaturedProducts() {
  const items = featuredProducts();
  return (
    <section id="featured" aria-labelledby="featured-title" className="py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end md:mb-12">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">Our Shop</p>
              <h2 id="featured-title" className="mt-2 font-display text-3xl leading-tight text-forest sm:mt-3 sm:text-4xl md:text-5xl">
                Straight from our kitchen, <span className="italic text-clay">to yours</span>
              </h2>
            </div>
            <Link href="/shop" className="btn-secondary self-start md:self-auto text-sm sm:text-[15px]">View all products <ArrowIcon /></Link>
          </div>
        </Reveal>
        <ul className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={i * 100} className="h-full"><ProductCard product={p} /></Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
