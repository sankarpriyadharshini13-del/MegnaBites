import { formatInr } from "@/lib/format";

export default function Price({ amount, className = "" }: { amount: number | null; className?: string }) {
  if (amount == null)
    return <span className={`text-sm italic text-ink/55 ${className}`}>Price to be confirmed</span>;
  return <span className={`font-display text-xl text-forest ${className}`}>{formatInr(amount)}</span>;
}
