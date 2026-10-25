"use client";

import { useEffect, useId, useState } from "react";
import { encodeCode128 } from "@/lib/admin/code128";
import type { Tone } from "@/lib/admin/logic";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useAdmin } from "@/lib/admin/store";

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`adm-b ${tone}`}>{children}</span>;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="adm-tg"
      onClick={() => onChange(!checked)}
    />
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="adm-tg-row">
      <span>{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function Avatar() {
  const { data } = useAdmin();
  const source = data?.me.name || data?.settings.store.owner || data?.me.email || "A";
  return <div className="adm-avatar" aria-hidden="true">{source.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "A"}</div>;
}

export function Topbar({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="adm-top">
      <div>
        <h1 className="adm-title">{title}</h1>
        <p className="adm-sub">{subtitle}</p>
      </div>
      <div className="adm-top-r">
        {children}
        <Avatar />
      </div>
    </header>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useModalBehavior(true, onClose, () =>
    document.querySelector<HTMLElement>(".adm-modal input, .adm-modal textarea, .adm-modal select"),
  );
  const id = useId();
  return (
    <div className="adm-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`adm-modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="adm-modal-h">
          <h2 id={id}>{title}</h2>
          <button type="button" className="adm-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="adm-modal-b">{children}</div>
        {footer && <div className="adm-modal-f">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="adm-btn pri"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: "var(--text)", lineHeight: 1.55 }}>{body}</p>
    </Modal>
  );
}

/** Single-field prompt dialog (address, phone, note…). */
export function PromptModal({
  title,
  label,
  initial = "",
  multiline,
  placeholder,
  confirmLabel = "Save",
  validate,
  onSubmit,
  onClose,
}: {
  title: string;
  label: string;
  initial?: string;
  multiline?: boolean;
  placeholder?: string;
  confirmLabel?: string;
  validate?: (v: string) => string | null;
  onSubmit: (v: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const err = validate?.(value) ?? null;
    if (err) return setError(err);
    onSubmit(value);
    onClose();
  };
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="adm-btn pri" onClick={submit}>{confirmLabel}</button>
        </>
      }
    >
      <label className="adm-fl" htmlFor="prompt-field">{label}</label>
      {multiline ? (
        <textarea id="prompt-field" className={`adm-ta${error ? " err" : ""}`} rows={4} value={value} placeholder={placeholder} autoFocus onChange={(e) => { setValue(e.target.value); setError(null); }} />
      ) : (
        <input id="prompt-field" className={`adm-in${error ? " err" : ""}`} value={value} placeholder={placeholder} autoFocus onChange={(e) => { setValue(e.target.value); setError(null); }} onKeyDown={(e) => e.key === "Enter" && submit()} />
      )}
      {error && <p className="adm-err">{error}</p>}
    </Modal>
  );
}

export function BarcodeSvg({ value, className = "bars" }: { value: string; className?: string }) {
  if (!value) return null;
  const { bars, width } = encodeCode128(value);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} 40`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Barcode ${value}`}
      fill="#111"
    >
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={40} />
      ))}
    </svg>
  );
}

/** Shows a masked value until focused, so personal data isn't on screen by default. */
export function MaskedInput({
  value,
  mask,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  mask: (v: string) => string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className="adm-in"
      aria-label={label}
      placeholder={placeholder}
      value={focused || !value ? value : mask(value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Reads a URL search param after mount (avoids needing Suspense for useSearchParams). undefined = not read yet. */
export function useQueryParam(name: string) {
  const [value, setValue] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}
