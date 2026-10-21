import Reveal from "./Reveal";

const founders = [
  {
    name: "Mageshwaran",
    role: "Director And Export Sales",
    initials: "M",
    gradient: "from-clay to-honey",
    note: "Oversees sourcing and quality — every batch tastes it.",
    icon: "🌾",
    color: "bg-clay",
  },
  {
    name: "Sathish",
    role: "Branch Manager",
    initials: "S",
    gradient: "from-leaf to-forest",
    note: "Runs operations and keeps the kitchen stone-grinding.",
    icon: "👨‍🍳",
    color: "bg-leaf",
  },
  {
    name: "Dinesh Kumar",
    role: "Digital Marketing and E-commerce",
    initials: "D",
    gradient: "from-honey to-clay",
    note: "Manages digital presence and online sales — connecting tradition with modern commerce.",
    icon: "💻",
    color: "bg-honey",
  },
];

const values = [
  {
    icon: "🪨",
    title: "Stone-Ground Methods",
    description: "Traditional grinding on stone preserves authentic South Indian flavors.",
    color: "from-clay/20 to-honey/20",
  },
  {
    icon: "🏠",
    title: "Local Roots",
    description: "Family-run from Kolathur, Chennai — close to our sourcing and customers.",
    color: "from-leaf/20 to-forest/20",
  },
  {
    icon: "🌿",
    title: "Thoughtful Choices",
    description: "Ingredients selected with care for quality and authenticity.",
    color: "from-leaf/20 to-clay/20",
  },
  {
    icon: "🤝",
    title: "Family Run",
    description: "Two founders, one vision — personal care in every step.",
    color: "from-honey/20 to-clay/20",
  },
];

export default function About() {
  return (
    <section id="about" aria-label="About us" className="relative overflow-hidden bg-gradient-to-b from-cream to-sand/30 py-12 md:py-16 lg:py-20">
      {/* Decorative pattern */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #8b6914 0.5px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-clay/10 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-leaf/10 blur-3xl" />
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
              Traditional South Indian{" "}
              <span className="relative inline-block italic text-clay">
                heritage
                <svg aria-hidden="true" viewBox="0 0 340 14" preserveAspectRatio="none" className="absolute -bottom-1 left-[5%] h-3 w-[90%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 9C80 3 200 2 338 7" />
                </svg>
              </span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/70 sm:mt-8 sm:text-xl">
              Magna Eco Bites draws inspiration from traditional South Indian cuisine — the stone-ground flavors, the slow methods, the care in every step. Family-run from Kolathur, Chennai, we bring these authentic tastes to your table.
            </p>
            <div className="mt-6">
              <a
                href="/#about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-leaf transition-colors hover:text-forest hover:underline"
              >
                About Us
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </Reveal>

        {/* Values Grid */}
        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 50}>
              <div className="group relative h-full rounded-2xl border border-leaf/10 bg-white/60 p-5 shadow-soft transition-all duration-300 hover:border-leaf/30 hover:shadow-md">
                <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative flex h-full flex-col">
                  <div className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110">{value.icon}</div>
                  <h3 className="mt-3 font-display text-base font-semibold text-forest sm:text-lg">{value.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{value.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Founders */}
        <div className="mt-12 sm:mt-16">
          <Reveal>
            <h3 className="text-center font-display text-3xl text-forest sm:text-4xl">Meet the Team</h3>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {founders.map((founder, i) => (
              <Reveal key={founder.name} delay={i * 100}>
                <article className="group relative overflow-hidden rounded-2xl border border-leaf/10 bg-white/80 p-6 shadow-soft transition-all duration-300 hover:border-leaf/30 hover:shadow-md">
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className={`grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br ${founder.gradient} font-display text-3xl text-cream shadow-soft transition-transform duration-300 group-hover:scale-110`}
                      >
                        {founder.initials}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full ${founder.color} text-lg shadow-sm`}>
                        {founder.icon}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="mt-4 flex-1">
                      <h4 className="font-display text-xl font-semibold text-forest">{founder.name}</h4>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-clay">{founder.role}</p>
                      <p className="mt-3 text-sm leading-relaxed text-ink/60">{founder.note}</p>
                    </div>
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
