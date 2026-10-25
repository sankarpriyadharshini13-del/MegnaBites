"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { faqs } from "@/data/brand";
import { ArrowIcon, ChevronIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative bg-cream py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <Reveal className="lg:col-span-5">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title={<>Questions, <span className="italic text-clay">answered</span></>}
            lead="Ordering, sourcing, storage and delivery."
          />
          <div className="mt-8 rounded-[1.5rem] bg-sand/60 p-6">
            <p className="font-display text-lg text-forest">Still curious?</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/65">Read our story or send us a note — we usually reply within a day.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/about" className="focus-ring inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep">
                About us <ArrowIcon width={15} height={15} />
              </Link>
              <a href="/#contact" className="focus-ring inline-flex items-center rounded-full border border-forest/15 px-5 py-2.5 text-sm font-semibold text-forest hover:border-forest">
                Contact us
              </a>
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <ul className="divide-y divide-forest/10 rounded-[1.75rem] bg-white px-5 shadow-soft ring-1 ring-forest/[0.06] sm:px-7">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              const panel = `${baseId}-p${i}`;
              return (
                <li key={f.q}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={panel}
                      className="focus-ring flex w-full items-center justify-between gap-4 rounded py-5 text-left"
                    >
                      <span className="font-display text-base text-forest sm:text-lg">{f.q}</span>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${isOpen ? "rotate-180 bg-forest text-cream" : "bg-sand text-forest"}`}>
                        <ChevronIcon width={16} height={16} />
                      </span>
                    </button>
                  </h3>
                  <div id={panel} role="region" className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <p className="overflow-hidden pr-10 text-sm leading-relaxed text-ink/70 sm:text-[15px]">{f.a}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
