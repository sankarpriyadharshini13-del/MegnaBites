import Link from "next/link";
import { differentiators } from "@/data/site";
import { ArrowIcon, FamilyIcon, PinIcon, StoneIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const icons = { pin: PinIcon, stone: StoneIcon, family: FamilyIcon };

export default function WhyMagna({ learnMore = true }: { learnMore?: boolean }) {
  return (
    <section id="why-magna-bites" aria-labelledby="why-title" className="relative overflow-hidden bg-forest py-16 text-cream md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-clay/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-leaf/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            id="why-title"
            tone="dark"
            eyebrow="Why Magna Bites"
            title={<>Made the slow way, <span className="italic text-honey">on purpose</span></>}
            lead="Three things we do every day, in our own kitchen in Kolathur."
            action={learnMore ? { href: "/about", label: "About us" } : undefined}
          />
        </Reveal>
        <ol className="relative mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          <span aria-hidden="true" className="absolute left-[16.5%] right-[16.5%] top-8 hidden h-px bg-gradient-to-r from-honey/0 via-honey/40 to-honey/0 md:block" />
          {differentiators.map((d, i) => {
            const Icon = icons[d.icon];
            return (
              <li key={d.title}>
                <Reveal delay={i * 120} className="h-full">
                  <article className="relative flex h-full flex-col rounded-[1.75rem] border border-cream/10 bg-cream/[0.04] p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-cream/[0.08] sm:p-8">
                    <div className="flex items-center gap-4">
                      <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream text-forest shadow-soft">
                        <Icon width={26} height={26} />
                      </span>
                      <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-honey">Step 0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-display text-xl leading-snug sm:text-2xl">{d.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-cream/70 sm:text-base">{d.body}</p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
        {learnMore && (
          <Reveal delay={300}>
            <p className="mt-10 text-sm text-cream/70">
              Curious how a pack of podi comes together?{" "}
              <Link href="/about#sourcing" className="focus-ring inline-flex items-center gap-1 rounded font-semibold text-honey underline-offset-4 hover:underline">
                Learn more <ArrowIcon width={14} height={14} />
              </Link>
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
