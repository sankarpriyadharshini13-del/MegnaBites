import { MinusIcon, PlusIcon } from "./Icons";

interface Props {
  value: number;
  onChange: (n: number) => void;
  label: string;
  max?: number;
  min?: number;
  /** When set, + stays clickable at `max` and calls this instead (e.g. to explain the stock limit). */
  onLimit?: () => void;
}

export default function QuantityControl({ value, onChange, label, max = 20, min = 1, onLimit }: Props) {
  const atMax = value >= max;
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className="inline-flex items-center rounded-full border border-leaf/20 bg-white/60">
      <button type="button" className="qty-btn" aria-label={`Decrease quantity of ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <MinusIcon />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-forest" aria-live="polite">{value}</span>
      <button
        type="button"
        className="qty-btn aria-disabled:cursor-not-allowed aria-disabled:opacity-35"
        aria-label={`Increase quantity of ${label}${atMax ? " (limit reached)" : ""}`}
        disabled={atMax && !onLimit}
        aria-disabled={(atMax && !!onLimit) || undefined}
        onClick={() => (atMax ? onLimit?.() : onChange(value + 1))}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
