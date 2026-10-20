import { differentiators } from "@/data/site";
import { FamilyIcon, PinIcon, StoneIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";

const icons = { pin: PinIcon, stone: StoneIcon, family: FamilyIcon };

export default function WhyMagna() {
  return (
    <section id="why-magna-bites" aria-labelledby="why-title" className="relative overflow-hidden bg-forest py-16 text-cream md:py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-clay/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-honey sm:text-xs">Why Magna Bites</p>
            <h2 id="why-title" className="mt-2 font-display text-3xl leading-tight sm:mt-3 sm:text-4xl md:text-5xl">
              Made the slow way, <span className="italic text-honey">on purpose</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream/70 sm:mt-5 sm:text-lg">
              Three things we do every day, in our own kitchen in Kolathur.
            </p>
          </div>
        </Reveal>
        <ol className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {differentiators.map((d, i) => {
            const Icon = icons[d.icon];
            return (
              <li key={d.title}>
                <Reveal delay={i * 120} className="h-full">
                  <article className="flex h-full flex-col rounded-[1.5rem] border border-cream/10 bg-forest-card/60 p-6 transition-colors duration-300 hover:bg-forest-card sm:rounded-[2rem] sm:p-8">
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-cream text-forest sm:h-14 sm:w-14 sm:rounded-2xl"><Icon width={22} height={22} className="sm:w-[26px] sm:h-[26px]" /></span>
                      <span aria-hidden="true" className="font-display text-3xl text-cream/20 sm:text-4xl">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-display text-xl leading-snug sm:mt-8 sm:text-2xl">{d.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-cream/70 sm:mt-3 sm:text-base">{d.body}</p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
