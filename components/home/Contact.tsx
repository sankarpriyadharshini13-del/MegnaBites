"use client";

import { site } from "@/data/site";
import { ArrowIcon, MailIcon, PinIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const field =
  "w-full rounded-xl border border-forest/10 bg-cream/60 px-4 py-3 text-ink outline-none transition-all placeholder:text-ink/35 focus:border-leaf focus:bg-white focus:ring-4 focus:ring-leaf/15";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-sand/45 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-forest/[0.06] lg:grid-cols-5">
          <Reveal className="bg-forest p-7 text-cream sm:p-10 lg:col-span-2">
            <SectionHeading
              id="contact-title"
              tone="dark"
              eyebrow="Get in touch"
              title={<>Have a question about <span className="italic text-honey">an order?</span></>}
              lead="Bulk orders, custom packing or anything else — we're happy to help."
            />
            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-4 rounded-2xl bg-cream/[0.06] p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream text-forest"><PinIcon width={20} height={20} /></span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-honey">Visit</span>
                  <span className="text-sm sm:text-base">{site.location}</span>
                </span>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="focus-ring flex items-center gap-4 rounded-2xl bg-cream/[0.06] p-4 transition-colors hover:bg-cream/[0.12]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream text-forest"><MailIcon width={20} height={20} /></span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-honey">Email</span>
                    <span className="block break-all text-sm sm:text-base">{site.email}</span>
                  </span>
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm text-cream/60">We usually reply within a day.</p>
          </Reveal>

          <Reveal delay={120} className="p-7 sm:p-10 lg:col-span-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                const body = `Name: ${d.get("name")}\nContact: ${d.get("contact")}\n\n${d.get("message")}`;
                window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(body)}`;
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-2 block text-sm font-semibold text-forest">Name</label>
                  <input id="c-name" name="name" required autoComplete="name" type="text" placeholder="Your name" className={field} />
                </div>
                <div>
                  <label htmlFor="c-contact" className="mb-2 block text-sm font-semibold text-forest">Phone / Email</label>
                  <input id="c-contact" name="contact" required type="text" placeholder="How can we reach you?" className={field} />
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="c-message" className="mb-2 block text-sm font-semibold text-forest">Message</label>
                <textarea id="c-message" name="message" required rows={5} placeholder="Tell us what you need" className={`${field} resize-none`} />
              </div>
              <button type="submit" className="btn-primary group mt-6 w-full sm:w-auto">
                Send message <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 text-xs text-ink/50">Opens your email app with the message ready to send.</p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
