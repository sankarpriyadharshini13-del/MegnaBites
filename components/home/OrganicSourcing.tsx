import Reveal from "./Reveal";

const features = [
  {
    icon: "🌱",
    title: "Organic Cultivation",
    description: "Partnering with farmers who practice sustainable growing methods",
  },
  {
    icon: "📍",
    title: "Local Sourcing",
    description: "Ingredients sourced from trusted farms in Tamil Nadu",
  },
  {
    icon: "✨",
    title: "Quality First",
    description: "Every batch carefully selected for freshness and taste",
  },
];

export default function OrganicSourcing() {
  return (
    <section id="sourcing" aria-label="Organic Sourcing" className="relative overflow-hidden bg-gradient-to-b from-sand/50 to-cream py-12 md:py-16 lg:py-20">
      {/* Decorative pattern */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #4a7c59 0.5px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute left-1/4 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-leaf/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-64 w-64 translate-x-1/2 rounded-full bg-clay/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-white/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-leaf sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-leaf" aria-hidden="true" />
              Thoughtfully Sourced
            </span>
            <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-forest sm:mt-6 sm:text-4xl md:text-5xl">
              Organic cultivation from{" "}
              <span className="relative inline-block italic text-clay">
                trusted farms
                <svg aria-hidden="true" viewBox="0 0 340 14" preserveAspectRatio="none" className="absolute -bottom-1 left-[5%] h-3 w-[90%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 9C80 3 200 2 338 7" />
                </svg>
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:mt-6 sm:text-lg">
              We work closely with local farmers who share our commitment to sustainable growing practices. Every ingredient is carefully selected to bring you food you can feel good about.
            </p>
          </div>
        </Reveal>

        {/* Two-column layout */}
        <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-2 lg:gap-12">
          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <Reveal key={index} delay={index * 50}>
                <div className="group flex items-start gap-4 rounded-2xl border border-leaf/10 bg-white/60 p-5 shadow-soft transition-all duration-300 hover:border-leaf/30 hover:shadow-md">
                  <div className="grid shrink-0 h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-leaf/10 to-leaf/5 text-3xl transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-forest">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60">{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Visual */}
          <Reveal delay={150}>
            <div className="relative flex items-center justify-center">
              <div className="relative">
                {/* Main visual */}
                <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-3xl bg-gradient-to-br from-leaf/20 via-leaf/10 to-clay/20 p-6 shadow-soft">
                  <div className="absolute inset-3 rounded-2xl bg-gradient-to-br from-leaf/10 to-clay/10" />
                  <div className="relative h-full w-full rounded-2xl bg-white/80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl sm:text-7xl">🌿</div>
                      <p className="mt-3 font-display text-base font-semibold text-forest">Farm to Table</p>
                      <p className="mt-1 text-xs text-ink/60">Fresh from Tamil Nadu</p>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -right-4 top-4 rounded-xl bg-white/90 px-4 py-3 shadow-soft transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <p className="text-xs font-semibold text-forest">100% Natural</p>
                      <p className="text-[10px] text-ink/60">No preservatives</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-4 rounded-xl bg-white/90 px-4 py-3 shadow-soft transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤝</span>
                    <div>
                      <p className="text-xs font-semibold text-forest">Direct Trade</p>
                      <p className="text-[10px] text-ink/60">Fair to farmers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="mt-10 text-center sm:mt-12">
            <a
              href="/#about"
              className="inline-flex items-center gap-2 rounded-full border-2 border-forest bg-forest px-6 py-3 font-semibold text-cream transition-all duration-300 hover:bg-forest/90 hover:shadow-lg hover:scale-105"
            >
              Learn About Our Process
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
