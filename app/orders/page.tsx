import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import MyOrders from "./MyOrders";

export const metadata: Metadata = { title: "My orders | Magna Eco Bites", robots: { index: false, follow: false } };

export default function OrdersPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 md:py-20 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-ink/55 sm:text-sm">
          <Link href="/" className="focus-ring rounded hover:text-clay">Home</Link> <span aria-hidden="true">/</span>{" "}
          <Link href="/account" className="focus-ring rounded hover:text-clay">Account</Link> <span aria-hidden="true">/</span>{" "}
          <span aria-current="page" className="text-forest">My orders</span>
        </nav>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">Your account</p>
        <h1 className="mt-2 mb-8 font-display text-3xl text-forest sm:mt-3 sm:text-4xl md:text-5xl">My <span className="italic text-clay">orders</span></h1>
        <MyOrders />
      </section>
    </SiteShell>
  );
}
