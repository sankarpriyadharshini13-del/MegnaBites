import Link from "next/link";
import Reveal from "./Reveal";
import { featuredProducts } from "@/data/products";

const usageExamples = [
  {
    dish: "Idli with Podi",
    description: "Traditional steamed rice cakes served with our stone-ground idli podi. Mix with sesame oil or ghee for the authentic South Indian breakfast experience.",
    servingTip: "Best with sesame oil or ghee",
    productSlug: "idli-podi",
    productName: "Idli Podi",
    icon: "🥢",
    color: "from-leaf to-forest",
  },
  {
    dish: "Dosa with Chutney",
    description: "Crispy dosa paired with our flavorful podi blends. The perfect combination for a hearty morning meal or evening snack.",
    servingTip: "Perfect for breakfast or snacks",
    productSlug: "moringa-idli-podi",
    productName: "Moringa Idli Podi",
    icon: "🫓",
    color: "from-clay to-honey",
  },
  {
    dish: "Sweet Treats",
    description: "Use our country sugar in payasam, halwa, or your favorite traditional sweets. A natural, minimally processed sweetener that enhances every dish.",
    servingTip: "Ideal for desserts & sweets",
    productSlug: "country-sugar",
    productName: "Country Sugar",
    icon: "🍯",
    color: "from-honey to-clay",
  },
];

export default function ProductUsage() {
  return (
    <section id="usage" aria-label="Product Usage" className="relative overflow-hidden bg-gradient-to-b from-sand/50 to-cream py-12 md:py-16 lg:py-20">
      {/* Decorative pattern */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #d4a574 0.5px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute left-1/4 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-honey/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-20 h-64 w-64 translate-x-1/2 rounded-full bg-leaf/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-honey/30 bg-white/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-clay sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-honey" aria-hidden="true" />
              In Your Kitchen
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium leading-tight text-forest sm:mt-8 sm:text-5xl">
              How to enjoy our{" "}
              <span className="relative inline-block italic text-clay">
                products
                <svg aria-hidden="true" viewBox="0 0 340 14" preserveAspectRatio="none" className="absolute -bottom-1 left-[5%] h-3 w-[90%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 9C80 3 200 2 338 7" />
                </svg>
              </span>
            </h2>
            <p className="mt-4 text-lg text-ink/70">
              Classic South Indian dishes made better with Magna Bites
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {usageExamples.map((example, index) => (
            <Reveal key={index} delay={index * 100}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-leaf/10 bg-white/60 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift">
                {/* Header with icon */}
                <div className={`relative bg-gradient-to-br ${example.color} p-8 pb-16`}>
                  <div className="absolute top-4 right-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream backdrop-blur-sm">
                    Serving Idea
                  </div>
                  <div className="text-6xl transition-transform duration-300 group-hover:scale-110">{example.icon}</div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-6 -mt-8">
                  <div className="rounded-2xl bg-white/90 p-6 shadow-sm">
                    <h3 className="font-display text-2xl font-semibold text-forest">{example.dish}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">
                      {example.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-leaf">
                      <span className="text-lg">💡</span>
                      {example.servingTip}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-leaf/10">
                    <Link
                      href={`/products/${example.productSlug}`}
                      className="inline-flex items-center gap-2 font-semibold text-leaf transition-colors group-hover:text-forest"
                    >
                      Shop {example.productName}
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="mt-10 text-center sm:mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border-2 border-forest bg-forest px-8 py-4 font-semibold text-cream transition-all duration-300 hover:bg-forest/90 hover:shadow-lg hover:scale-105"
            >
              View All Products
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
