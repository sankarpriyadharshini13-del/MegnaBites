"use client";

import { useState } from "react";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}

export default function PasswordField({ id, label, value, onChange, autoComplete, hint }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} className="field pr-16" autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold text-forest hover:bg-sand">
          {show ? "Hide" : "Show"}<span className="sr-only"> password</span>
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
