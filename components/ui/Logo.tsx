import Link from "next/link";
import { LeafIcon } from "./Icons";

export default function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" aria-label="Magna Eco Bites — home" className="focus-ring group inline-flex items-center gap-2.5 rounded-xl">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 bg-forest text-cream shadow-soft transition-transform duration-300 group-hover:rotate-6">
        <LeafIcon width={22} height={22} />
      </span>
      <span className={`whitespace-nowrap font-display text-lg tracking-tight sm:text-xl md:text-2xl ${onDark ? "text-cream" : "text-forest"}`}>
        Magna <span className="italic text-clay">Eco Bites</span>
      </span>
    </Link>
  );
}
