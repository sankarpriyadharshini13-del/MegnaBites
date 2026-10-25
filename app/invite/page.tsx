import type { Metadata } from "next";
import SiteShell from "@/components/layout/SiteShell";
import InviteContent from "./InviteContent";

export const metadata: Metadata = { title: "Admin invitation | Magna Eco Bites", robots: { index: false, follow: false } };

export default function InvitePage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 md:py-20 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">Team</p>
        <h1 className="mt-2 mb-6 font-display text-3xl text-forest sm:mt-3 sm:text-4xl md:text-5xl">Admin <span className="italic text-clay">invitation</span></h1>
        <InviteContent />
      </section>
    </SiteShell>
  );
}
