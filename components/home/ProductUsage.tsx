"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { servingIdeas } from "@/data/brand";
import { useProducts } from "@/context/ProductsContext";
import AddToCartButton from "@/components/product/AddToCartButton";
import { stockState } from "@/components/product/ProductCard";
import Price from "@/components/ui/Price";
import { ArrowIcon, LeafIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const TONES = ["from-forest to-leaf", "from-clay to-honey", "from-honey to-clay"];

export default function ProductUsage() {
  const { getById } = useProducts();
  const [index, setIndex] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const idea = servingIdeas[index];
  // Hidden or deleted products fall back to the shop instead of a broken link.
  const product = getById(idea.productSlug);
  const stock = product ? stockState(product) : null;
  const href = product ? `/products/${product.slug}` : "/shop";

  const select = (i: number, focus = false) => {
    const next = (i + servingIdeas.length) % servingIdeas.length;
    setIndex(next);
    if (focus) tabsRef.current[next]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select(index + 1, true); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select(index - 1, true); }
  };

  return (
    <section id="usage" aria-labelledby="usage-title" className="relative overflow-hidden bg-sand/45 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            id="usage-title"
            eyebrow="In your kitchen"
            title={<>How to enjoy <span className="italic text-clay">Magna Bites</span></>}
            lead="Classic South Indian dishes, served the way we serve them at home. Pick a dish to see how."
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 lg:grid-cols-12 lg:gap-8">
          {/* Dish picker: chips on phones, a vertical list on large screens */}
          <Reveal className="min-w-0 lg:col-span-4">
            <div role="tablist" aria-label="Serving ideas" aria-orientation="vertical" onKeyDown={onKey} className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {servingIdeas.map((s, i) => {
                const on = i === index;
                const p = getById(s.productSlug);
                return (
                  <button
                    key={s.dish}
                    ref={(el) => { tabsRef.current[i] = el; }}
                    id={`${baseId}-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => select(i)}
                    className={`focus-ring group flex shrink-0 items-center gap-4 rounded-2xl border p-3 text-left transition-all lg:p-4 ${
                      on ? "border-forest bg-forest text-cream shadow-lift" : "border-forest/10 bg-white/70 text-forest hover:border-forest/30 hover:bg-white"
                    }`}
                  >
                    <span className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${TONES[i % TONES.length]} lg:h-14 lg:w-14`}>
                      {p?.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : <LeafIcon width={20} height={20} className="text-cream" />}
                    </span>
                    <span className="min-w-0 pr-1">
                      <span className={`block text-[10px] font-bold uppercase tracking-[0.16em] ${on ? "text-honey" : "text-clay"}`}>Idea 0{i + 1}</span>
                      <span className="block whitespace-nowrap font-display text-base leading-snug lg:whitespace-normal lg:text-lg">{s.dish}</span>
                      <span className={`hidden text-xs lg:block ${on ? "text-cream/60" : "text-ink/50"}`}>with {p?.name ?? s.productName}</span>
                    </span>
                    <ArrowIcon width={16} height={16} className={`ml-auto hidden shrink-0 transition-transform lg:block ${on ? "translate-x-0.5 text-honey" : "text-forest/30 group-hover:translate-x-0.5"}`} />
                  </button>
                );
              })}
            </div>
            <p className="mt-5 hidden text-sm leading-relaxed text-ink/60 lg:block">
              Every podi is stone-ground in small batches in our Kolathur kitchen.{" "}
              <Link href="/about" className="focus-ring rounded font-semibold text-forest underline-offset-4 hover:text-clay hover:underline">Learn more</Link>
            </p>
          </Reveal>

          {/* Selected dish */}
          <Reveal delay={100} className="min-w-0 lg:col-span-8">
            <div
              id={`${baseId}-panel`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${index}`}
              key={index}
              className="grid animate-fade-in overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-forest/[0.06] md:grid-cols-2"
            >
              <div className={`relative min-h-[240px] bg-gradient-to-br ${TONES[index % TONES.length]} sm:min-h-[300px] md:min-h-full`}>
                {product?.image ? (
                  <Image src={product.image} alt={product.imageAlt} fill sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 92vw" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-cream/90"><LeafIcon width={52} height={52} /></div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-forest shadow-soft">Serving idea</span>
                <span className="absolute bottom-4 left-4 right-4 inline-flex items-center gap-2 self-start rounded-2xl bg-forest/90 px-4 py-2.5 text-xs font-semibold text-cream backdrop-blur sm:right-auto">
                  <LeafIcon width={14} height={14} className="shrink-0 text-honey" /> {idea.tip}
                </span>
              </div>

              <div className="flex flex-col p-6 sm:p-8">
                <h3 className="font-display text-2xl leading-tight text-forest sm:text-3xl">{idea.dish}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/65 sm:text-[15px]">{idea.summary}</p>

                <ol className="relative mt-6 space-y-4">
                  <span aria-hidden="true" className="absolute bottom-3 left-[13px] top-3 w-px bg-forest/10" />
                  {idea.steps.map((step, i) => (
                    <li key={i} className="relative flex gap-4 text-sm leading-relaxed text-ink/75">
                      <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-xs font-bold text-cream ring-4 ring-white">{i + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-7 rounded-2xl bg-cream p-4 ring-1 ring-forest/[0.06]">
                  {product ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay">Made with</p>
                          <p className="font-display text-lg leading-tight text-forest">{product.name}</p>
                          <p className="text-xs text-ink/50">
                            {product.packSize ?? "Pack size to be confirmed"}
                            {stock && <span className={stock.tone === "out" ? " text-forest" : " text-clay"}> · {stock.label}</span>}
                          </p>
                        </div>
                        <span className="shrink-0 text-right"><Price amount={product.priceInr} original={product.originalPriceInr} className={product.priceInr == null ? "!text-xs" : "!text-2xl"} originalClassName="text-xs" /></span>
                      </div>
                      <div className="mt-4 flex gap-2.5">
                        <AddToCartButton productId={product.id} name={product.name} disabled={stock?.tone === "out"} compact className="!min-h-10 flex-1 !px-4 !text-sm !shadow-none hover:!translate-y-0" stepperClassName="!w-auto flex-1" />
                        <Link href={href} className="focus-ring inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-forest/15 bg-white px-3 text-sm font-semibold text-forest transition-colors hover:border-forest">
                          View details <ArrowIcon width={14} height={14} />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <Link href="/shop" className="focus-ring inline-flex items-center gap-2 rounded font-semibold text-forest hover:text-clay">
                      Browse the shop <ArrowIcon width={16} height={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
