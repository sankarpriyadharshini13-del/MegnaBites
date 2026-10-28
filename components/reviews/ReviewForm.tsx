"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export interface SavedReview {
  rating: number;
  message: string;
  createdAt: string;
}

const LATER_KEY = "magna-review-later";
const SKIP_KEY = "magna-review-skipped";
const MAX = 1000;
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function readList(key: string): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}
function writeList(key: string, list: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(new Set(list)).slice(-50)));
  } catch {
    /* storage unavailable */
  }
}

/** Orders the customer chose to review later (reminded on the My orders page). */
export const reviewLaterList = () => readList(LATER_KEY);
export function rememberLater(order: number) {
  writeList(LATER_KEY, [...readList(LATER_KEY), order]);
}
export function rememberSkipped(order: number) {
  writeList(SKIP_KEY, [...readList(SKIP_KEY), order]);
  writeList(LATER_KEY, readList(LATER_KEY).filter((n) => n !== order));
}
function forget(order: number) {
  writeList(LATER_KEY, readList(LATER_KEY).filter((n) => n !== order));
  writeList(SKIP_KEY, readList(SKIP_KEY).filter((n) => n !== order));
}

export function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-honey" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * 5-star rating + short message for one order.
 *  - mode "prompt" (right after checkout): Submit · Leave later · Skip
 *  - mode "inline" (My orders): Submit · Cancel
 */
export default function ReviewForm({
  orderNumber,
  mode,
  onDone,
}: {
  orderNumber: number;
  mode: "prompt" | "inline";
  onDone: (outcome: "submitted" | "later" | "skipped" | "cancelled", review?: SavedReview) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const shown = hover || rating;

  const submit = async () => {
    if (!rating) return setError("Choose a star rating first.");
    setBusy(true);
    setError("");
    const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ orderNumber, rating, message: message.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) return setError(body.error ?? "Your review couldn't be saved. Please try again.");
      forget(orderNumber);
      onDone("submitted", body.review);
    } catch {
      setBusy(false);
      setError("Network problem. Please try again.");
    }
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""} — ${LABELS[n]}`}
            onClick={() => { setRating(n); setError(""); }}
            onMouseEnter={() => setHover(n)}
            className="focus-ring rounded-lg p-1 text-honey transition-transform hover:scale-110"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" fill={n <= shown ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-forest">{shown ? LABELS[shown] : ""}</span>
      </div>

      <label htmlFor={`review-${orderNumber}`} className="mt-4 block text-sm font-semibold text-forest">Your review <span className="font-normal text-ink/45">(optional)</span></label>
      <textarea
        id={`review-${orderNumber}`}
        rows={3}
        maxLength={MAX}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How did you enjoy it?"
        className="field mt-1.5 resize-none"
      />
      <p className="mt-1 text-right text-xs text-ink/40">{message.length}/{MAX}</p>
      {error && <p role="alert" className="mt-1 text-sm font-medium text-clay">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary disabled:opacity-60" disabled={busy} onClick={submit}>{busy ? "Sending…" : "Submit review"}</button>
        {mode === "prompt" ? (
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => { rememberLater(orderNumber); onDone("later"); }}>Leave later</button>
            <button type="button" className="text-sm font-semibold text-ink/55 underline-offset-4 hover:text-clay hover:underline" disabled={busy} onClick={() => { rememberSkipped(orderNumber); onDone("skipped"); }}>Skip</button>
          </>
        ) : (
          <button type="button" className="text-sm font-semibold text-ink/55 underline-offset-4 hover:text-clay hover:underline" disabled={busy} onClick={() => onDone("cancelled")}>Cancel</button>
        )}
      </div>
    </div>
  );
}
