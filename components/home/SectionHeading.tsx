import Link from "next/link";
import { ArrowIcon } from "@/components/ui/Icons";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  action?: { href: string; label: string };
  id?: string;
}

/** Shared heading for the home page sections: eyebrow, display title, optional lead and link. */
export default function SectionHeading({ eyebrow, title, lead, align = "left", tone = "light", action, id }: Props) {
  const dark = tone === "dark";
  const centered = align === "center";
  return (
    <div className={`flex flex-col gap-5 ${centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        <p className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] sm:text-xs ${dark ? "text-honey" : "text-clay"}`}>
          <span aria-hidden="true" className={`h-px w-6 ${dark ? "bg-honey/70" : "bg-clay/60"}`} />
          {eyebrow}
        </p>
        <h2 id={id} className={`mt-3 font-display text-[2rem] leading-[1.1] tracking-tight sm:text-4xl md:text-5xl ${dark ? "text-cream" : "text-forest"}`}>
          {title}
        </h2>
        {lead && <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-cream/70" : "text-ink/65"}`}>{lead}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className={`focus-ring group inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${centered ? "self-center" : "md:self-auto"} ${
            dark ? "border-cream/25 text-cream hover:bg-cream hover:text-forest" : "border-forest/15 text-forest hover:border-forest hover:bg-forest hover:text-cream"
          }`}
        >
          {action.label}
          <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
