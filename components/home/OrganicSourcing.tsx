import Image from "next/image";
import Link from "next/link";
import { sourcingPrinciples } from "@/data/brand";
import { ArrowIcon, BasketIcon, PinIcon, SproutIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const icons = { cultivation: SproutIcon, sourcing: PinIcon, choices: BasketIcon };

export default function OrganicSourcing({ learnMore = true }: { learnMore?: boolean }) {
  return (
    <section id="sourcing" aria-labelledby="sourcing-title" className="relative overflow-hidden bg-cream py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand shadow-lift sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src="/images/hero-moringa-card.jpg"
                alt="Magna Eco Bites podi in a wooden bowl"
                fill
                sizes="(min-width:1024px) 45vw, 92vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-5 right-5 rounded-2xl bg-forest p-5 text-cream shadow-lift sm:left-auto sm:right-6 sm:w-72">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-honey">From Kolathur, Chennai</p>
              <p className="mt-1.5 font-display text-lg leading-snug">Sourced, stone-ground and packed in our own kitchen.</p>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <SectionHeading
              id="sourcing-title"
              eyebrow="Thoughtfully sourced"
              title={<>Good food starts <span className="italic text-clay">long before the kitchen</span></>}
              lead="Where our ingredients come from matters as much as how we grind them."
            />
          </Reveal>
          <ol className="mt-8 space-y-4">
            {sourcingPrinciples.map((p, i) => {
              const Icon = icons[p.key];
              return (
                <li key={p.key}>
                  <Reveal delay={i * 90}>
                    <div className="flex gap-4 rounded-2xl border border-forest/[0.07] bg-white/70 p-5 transition-colors hover:border-leaf/30 hover:bg-white">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-leaf/10 text-leaf">
                        <Icon width={22} height={22} />
                      </span>
                      <div>
                        <h3 className="font-display text-lg text-forest sm:text-xl">{p.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink/65 sm:text-[15px]">{p.body}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
          {learnMore && (
            <Reveal delay={300}>
              <Link href="/about#story" className="focus-ring group mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-soft transition-all hover:-translate-y-0.5 hover:bg-forest-deep">
                Learn more about us
                <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
