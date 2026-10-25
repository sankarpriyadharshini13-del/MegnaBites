import Link from "next/link";
import { story, team } from "@/data/brand";
import { ArrowIcon, FamilyIcon, PinIcon, StoneIcon, SproutIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const values = [
  { icon: StoneIcon, title: "Traditional recipes", body: "Stone-ground podis, inspired by South Indian home cooking." },
  { icon: PinIcon, title: "Local roots", body: "Sourced and packed in Kolathur, Chennai." },
  { icon: FamilyIcon, title: "Family run", body: "Two founders, personally involved in every batch." },
  { icon: SproutIcon, title: "Thoughtful choices", body: "Simple ingredients, selected with care." },
];

const AVATAR = ["from-clay to-honey", "from-leaf to-forest", "from-honey to-clay"];

export default function About({ aboutLink = true }: { aboutLink?: boolean }) {
  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-hidden bg-sand/45 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              id="about-title"
              eyebrow="Our story"
              title={<>Rooted in South Indian <span className="italic text-clay">tradition</span></>}
            />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink/70 sm:text-lg">
              <p>{story.inspiration}</p>
              <p>{story.roots}</p>
              <p>{story.family}</p>
            </div>
            {aboutLink && (
              <Link href="/about" className="focus-ring group mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-soft transition-all hover:-translate-y-0.5 hover:bg-forest-deep">
                About us
                <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </Reveal>

          <ul className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-6">
            {values.map((v, i) => (
              <li key={v.title}>
                <Reveal delay={i * 70} className="h-full">
                  <div className="h-full rounded-[1.5rem] bg-white p-6 shadow-soft ring-1 ring-forest/[0.06]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay"><v.icon width={21} height={21} /></span>
                    <h3 className="mt-4 font-display text-lg text-forest">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{v.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <div id="team" className="mt-16 sm:mt-20">
          <Reveal>
            <h3 className="font-display text-2xl text-forest sm:text-3xl">The people behind Magna Bites</h3>
          </Reveal>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <li key={m.name}>
                <Reveal delay={i * 90} className="h-full">
                  <article className="flex h-full items-start gap-4 rounded-[1.5rem] bg-white p-5 shadow-soft ring-1 ring-forest/[0.06] sm:p-6">
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${AVATAR[i % AVATAR.length]} font-display text-2xl text-cream`} aria-hidden="true">
                      {m.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-display text-lg leading-tight text-forest">{m.name}</h4>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-clay">{m.role}</p>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
