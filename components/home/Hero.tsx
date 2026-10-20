import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, LeafIcon } from "@/components/ui/Icons";

const tan = "#c9a679";

/** Hand-drawn banana leaf, top-left of the reference. */
function BananaLeaf({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 130 240" className={className} fill="none" stroke={tan} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 238C20 150 52 70 118 4C112 70 92 150 50 232" />
      <path d="M2 238C42 160 78 90 118 4" />
      {[30, 55, 80, 105, 130, 155, 180, 205].map((y, i) => (
        <path key={y} d={`M${20 + i * 3} ${y + 28}C${50 + i * 4} ${y + 8} ${80 + i * 2} ${y - 18} ${112 - i * 2} ${y - 30}`} opacity=".7" />
      ))}
    </svg>
  );
}

/** Village house + palm trees line-art, bottom-left of the reference. */
function Village({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 340 270" className={className} fill="none" stroke={tan} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      {/* house */}
      <path d="M0 270V196L42 150L130 168L150 208V270" />
      <path d="M0 196L42 150L130 168M42 150L58 214L150 208" opacity=".8" />
      <path d="M14 214h26v34H14zM64 222h22v26H64zM96 222h22v26H96z" opacity=".8" />
      <path d="M10 232h34M70 234h20M100 234h20" opacity=".6" />
      {/* palms */}
      <path d="M96 150C90 110 96 70 110 40M110 40C92 34 74 40 60 56M110 40C120 20 140 14 160 22M110 40C100 22 84 10 62 12M110 40C130 36 152 44 164 62M110 40C118 56 116 72 108 84" />
      <path d="M200 270C196 220 204 170 224 126M224 126C206 118 186 126 172 144M224 126C234 106 256 98 280 108M224 126C216 106 198 96 176 100M224 126C246 124 268 136 278 156M224 126C232 146 230 164 222 176" />
      <path d="M284 270C282 236 288 206 304 178M304 178C292 172 278 178 268 190M304 178C312 164 326 158 340 164M304 178C298 164 286 156 270 158" />
      {/* ground */}
      <path d="M150 262C200 256 250 266 340 262" opacity=".6" />
    </svg>
  );
}

/** Soft out-of-focus leaves in the corners of the reference. */
function BlurLeaf({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={`pointer-events-none absolute blur-[2px] ${className}`}>
      <path d="M20 180C30 100 80 40 190 10C180 90 130 150 20 180Z" fill="#5f8a4c" opacity=".55" />
      <path d="M20 180C70 120 120 70 190 10" stroke="#3d6a3a" strokeWidth="2" fill="none" opacity=".6" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden lg:flex lg:min-h-[calc(100vh-4.75rem)] lg:items-center">
      <BananaLeaf className="pointer-events-none absolute -left-4 top-[34%] hidden h-52 w-28 lg:block xl:h-60 xl:w-32" />
      <Village className="pointer-events-none absolute -left-2 bottom-0 hidden h-60 w-[17rem] lg:block xl:h-64 xl:w-80" />
      <BlurLeaf className="-right-10 -top-6 h-44 w-44 rotate-[200deg]" />
      <BlurLeaf className="-bottom-8 -right-8 h-52 w-52 rotate-[20deg]" />

      <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1fr_575px] lg:gap-11 lg:px-8 lg:py-10">
        <div className="lg:pr-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-clay/30 bg-white/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-clay sm:px-4 sm:py-2 sm:text-[11px]">
            <span className="h-2 w-2 rounded-full bg-clay" aria-hidden="true" />
            Grown, ground &amp; packed in Kolathur
          </p>

          <h1 id="hero-title" className="mt-6 font-display text-[2.25rem] font-medium leading-[1.1] tracking-[-0.015em] text-forest sm:mt-8 sm:text-[3rem] lg:text-[4.1rem] xl:text-[4.7rem]">
            Organic food, the way your{" "}
            <span className="relative inline-block pb-1 italic text-clay">
              grandmother
              <svg aria-hidden="true" viewBox="0 0 340 14" preserveAspectRatio="none" className="absolute -bottom-0.5 left-[6%] h-3 w-[88%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 9C80 3 200 2 338 7" /></svg>
            </span>{" "}
            made it.
          </h1>

          <p className="mt-6 max-w-[31rem] text-[0.95rem] leading-[1.7] text-ink/60 sm:mt-8 sm:text-[1.06rem] sm:leading-[1.75]">
            Magna Eco Bites brings you traditional idli podi, country sugar and moringa blends — made from organically sourced ingredients, with no shortcuts.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 sm:mt-9">
            <Link href="/shop" className="btn-primary min-h-[3rem] px-6 text-sm sm:min-h-[3.4rem] sm:px-8 sm:text-[15px]">Browse Products <ArrowIcon /></Link>
            <Link href="/#about" className="btn-secondary min-h-[3rem] px-6 text-sm border-ink/15 bg-white/40 text-ink sm:min-h-[3.4rem] sm:px-8 sm:text-[15px] hover:bg-forest hover:text-cream">Our Story</Link>
          </div>

          <div className="mt-7 flex items-center gap-3 sm:mt-9">
            <div className="flex -space-x-2.5" aria-hidden="true">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-clay font-display text-base text-white/90 ring-2 ring-cream sm:h-11 sm:w-11 sm:text-lg">M</span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-forest font-display text-base text-white ring-2 ring-cream sm:h-11 sm:w-11 sm:text-lg">S</span>
            </div>
            <p className="text-xs text-ink/55 sm:text-sm"><span className="font-semibold text-ink">Family run</span> · Made fresh in small batches</p>
          </div>
        </div>

        <figure className="relative mx-auto aspect-[575/720] w-full max-w-[575px] overflow-hidden rounded-[2rem] bg-forest-card shadow-lift lg:mx-0 lg:rounded-[2.75rem]">
          <Image src="/images/hero-moringa-card.jpg" alt="Kraft pack of Magna Eco Bites Moringa Idli Podi beside a wooden bowl of the podi, moringa leaves and curry leaves" fill priority sizes="(min-width:1024px) 575px, 92vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-forest-deep/70 to-transparent" />
          <div className="absolute left-[5%] top-[4.5%] flex items-start gap-4 rounded-xl bg-cream px-3 py-2.5 shadow-soft sm:gap-6 sm:rounded-2xl sm:px-4 sm:py-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40 sm:text-[10px]">Purity</p>
              <p className="font-display text-base text-forest sm:text-[1.15rem]">100% Organic</p>
            </div>
            <LeafIcon width={14} height={14} className="text-leaf sm:w-4 sm:h-4" />
          </div>
          <div className="absolute bottom-[14.5%] right-[3.5%] flex items-start gap-6 rounded-xl bg-cream px-3 py-2.5 shadow-soft sm:gap-8 sm:rounded-2xl sm:px-4 sm:py-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40 sm:text-[10px]">Process</p>
              <p className="font-display text-base text-forest sm:text-[1.15rem]">No additives</p>
            </div>
            <LeafIcon width={14} height={14} className="text-leaf sm:w-4 sm:h-4" />
          </div>
          <figcaption className="absolute bottom-[4.5%] left-[6.5%] right-4 text-cream">
            <p className="font-display text-[1.4rem] leading-tight sm:text-[1.65rem] lg:text-[1.9rem]">Stone-ground <span aria-hidden="true">•</span> Small batch</p>
            <p className="mt-1 text-[0.85rem] text-cream/70 sm:mt-1.5 sm:text-[0.95rem]">Moringa Idli Podi — our newest blend</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
