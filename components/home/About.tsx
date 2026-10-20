import Reveal from "./Reveal";

const founders = [
  {
    name: "Mageshwaran",
    role: "Co-Founder",
    initials: "M",
    gradient: "from-clay to-honey",
    note: "Oversees sourcing and quality — every batch tastes it.",
  },
  {
    name: "Sathish",
    role: "Co-Founder",
    initials: "S",
    gradient: "from-leaf to-forest",
    note: "Runs operations and keeps the kitchen stone-grinding.",
  },
];

const values = [
  {
    icon: "🌿",
    title: "100% Organic",
    description: "Sourced from trusted organic farms, no shortcuts, no compromises.",
  },
  {
    icon: "🪨",
    title: "Stone-Ground",
    description: "Traditional grinding on stone preserves authentic flavors and nutrients.",
  },
  {
    icon: "🏠",
    title: "Small Batches",
    description: "Made fresh in small batches to ensure quality in every pack.",
  },
  {
    icon: "🤝",
    title: "Family Run",
    description: "Two founders, one vision — personal care in every step.",
  },
];

export default function About() {
  return (
    <section id="about" aria-label="About us" className="relative overflow-hidden bg-gradient-to-b from-cream to-sand/30 py-20 md:py-24 lg:py-32">
      {/* Decorative elements */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-clay/5 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-leaf/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-clay/30 bg-white/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-clay sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-clay" aria-hidden="true" />
              Our Story
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium leading-tight text-forest sm:mt-8 sm:text-5xl md:text-6xl">
              From a simple idea to{" "}
              <span className="relative inline-block italic text-clay">
                tradition
                <svg aria-hidden="true" viewBox="0 0 340 14" preserveAspectRatio="none" className="absolute -bottom-1 left-[5%] h-3 w-[90%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 9C80 3 200 2 338 7" />
                </svg>
              </span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/70 sm:mt-8 sm:text-xl">
              Magna Eco Bites was started with a simple goal — bring traditionally made food back onto everyday tables. Every product is sourced and packed with care, right here in Kolathur.
            </p>
          </div>
        </Reveal>

        {/* Values Grid */}
        <div className="mt-16 grid gap-6 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 100}>
              <div className="group rounded-3xl border border-leaf/10 bg-white/60 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8">
                <div className="text-4xl sm:text-5xl">{value.icon}</div>
                <h3 className="mt-4 font-display text-xl text-forest sm:text-2xl">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60 sm:text-base">{value.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Founders */}
        <div className="mt-20 sm:mt-24">
          <Reveal>
            <h3 className="text-center font-display text-3xl text-forest sm:text-4xl">Meet the Founders</h3>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:gap-8">
            {founders.map((founder, i) => (
              <Reveal key={founder.name} delay={i * 120}>
                <article className="group flex flex-col items-center rounded-[2rem] border border-leaf/10 bg-white/60 p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-start sm:p-10">
                  <div
                    className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${founder.gradient} font-display text-3xl text-cream shadow-soft transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 sm:h-24 sm:w-24 sm:text-4xl`}
                  >
                    {founder.initials}
                  </div>
                  <div className="mt-6 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h4 className="font-display text-2xl text-forest sm:text-3xl">{founder.name}</h4>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-clay sm:text-base">{founder.role}</p>
                    <p className="mt-3 text-sm leading-relaxed text-ink/60 sm:text-base">{founder.note}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
