import { formatInr } from "@/lib/format";

/**
 * Selling price, with the original ("was") price struck through before it when it's higher.
 * `className` sizes the selling price; `originalClassName` sizes the struck-through one.
 */
export default function Price({
  amount,
  original = null,
  className = "",
  originalClassName = "text-sm",
}: {
  amount: number | null;
  original?: number | null;
  className?: string;
  originalClassName?: string;
}) {
  if (amount == null)
    return <span className={`text-sm italic text-ink/55 ${className}`}>Price to be confirmed</span>;
  const selling = <span className={`font-display text-xl text-forest ${className}`}>{formatInr(amount)}</span>;
  if (original == null || original <= amount) return selling;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <s className={`font-medium text-ink/45 decoration-ink/40 ${originalClassName}`}>
        <span className="sr-only">Original price </span>
        {formatInr(original)}
      </s>
      <span className="sr-only">, now </span>
      {selling}
    </span>
  );
}

/** Whole-number percentage saved, or null when there's no discount. */
export function percentOff(amount: number | null, original: number | null) {
  if (amount == null || original == null || original <= amount || original <= 0) return null;
  return Math.round(((original - amount) / original) * 100);
}
