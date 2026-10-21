"use client";

import { site } from "@/data/site";
import Reveal from "./Reveal";

const details = [
  {
    label: "Visit",
    value: "Kolathur, Chennai",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Email",
    value: site.email,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-sand/70 py-12 md:py-16 lg:py-20">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:gap-14 md:grid-cols-2 lg:px-8">
        <Reveal>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">
            Get In Touch
          </span>
          <h2 className="mt-2 font-display text-3xl leading-tight text-forest sm:mt-3 sm:text-4xl md:text-5xl">
            Have a question about{" "}
            <span className="italic text-clay">an order?</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink/70 sm:mt-5 sm:text-lg">
            Reach out for bulk orders, custom packing or anything else — we&apos;re
            happy to help.
          </p>

          <div className="mt-7 space-y-3 sm:mt-9 sm:space-y-4">
            {details.map((item) => (
              <div
                key={item.label}
                className="group flex items-center gap-3 rounded-xl border border-leaf/10 bg-cream/70 p-3.5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:rounded-2xl sm:p-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-forest text-honey transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11 sm:rounded-xl">
                  {item.icon}
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 sm:text-[11px]">
                    {item.label}
                  </p>
                  <p className="text-sm text-ink sm:text-base">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-ink/50 sm:mt-8 sm:text-sm">
            We usually reply within a day.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            const body = `Name: ${d.get("name")}\nContact: ${d.get("contact")}\n\n${d.get("message")}`;
            window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(body)}`;
          }} className="rounded-2xl bg-cream p-5 shadow-lift ring-1 ring-leaf/10 sm:rounded-3xl sm:p-7 md:p-9">
            <div>
              <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold text-ink/75 sm:mb-2">
                Name
              </label>
              <input
                id="c-name" name="name" required autoComplete="name"
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg border border-leaf/15 bg-white/60 px-3.5 py-2.5 text-ink outline-none transition-all duration-300 placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/15 sm:rounded-xl sm:px-4 sm:py-3"
              />
            </div>
            <div className="mt-4 sm:mt-5">
              <label htmlFor="c-contact" className="mb-1.5 block text-sm font-semibold text-ink/75 sm:mb-2">
                Phone / Email
              </label>
              <input
                id="c-contact" name="contact" required
                type="text"
                placeholder="How can we reach you?"
                className="w-full rounded-lg border border-leaf/15 bg-white/60 px-3.5 py-2.5 text-ink outline-none transition-all duration-300 placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/15 sm:rounded-xl sm:px-4 sm:py-3"
              />
            </div>
            <div className="mt-4 sm:mt-5">
              <label htmlFor="c-message" className="mb-1.5 block text-sm font-semibold text-ink/75 sm:mb-2">
                Message
              </label>
              <textarea
                id="c-message" name="message" required
                rows={4}
                placeholder="Tell us what you need"
                className="w-full resize-none rounded-lg border border-leaf/15 bg-white/60 px-3.5 py-2.5 text-ink outline-none transition-all duration-300 placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/15 sm:rounded-xl sm:px-4 sm:py-3"
              />
            </div>
            <button
              type="submit"
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-leaf to-forest px-5 py-3 text-sm font-semibold text-cream shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:mt-7 sm:px-6 sm:py-3.5"
            >
              Send Message
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
