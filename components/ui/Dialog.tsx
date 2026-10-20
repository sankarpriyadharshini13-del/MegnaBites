"use client";

import { useId } from "react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** drawer = right side sheet; top = search overlay; center = account modal */
  variant?: "drawer" | "top" | "center";
  initialFocus?: () => HTMLElement | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const panelClass = {
  drawer: "right-0 top-0 h-full w-full max-w-md rounded-l-[2rem] max-sm:max-w-none max-sm:rounded-none animate-slide-in",
  top: "left-1/2 top-4 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-[1.5rem] max-h-[85vh] animate-fade-in md:top-20 md:rounded-[2rem]",
  center: "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] max-h-[92vh] animate-fade-in md:rounded-[2rem]",
};

export default function Dialog({ open, onClose, title, variant = "center", initialFocus, children, footer }: Props) {
  const ref = useModalBehavior(open, onClose, initialFocus);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-forest-deep/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute flex flex-col overflow-hidden bg-cream shadow-lift ${panelClass[variant]}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-leaf/10 px-6 py-4">
          <h2 id={titleId} className="font-display text-2xl text-forest">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="icon-btn">
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-leaf/10 bg-sand/40 px-6 py-5">{footer}</div>}
      </div>
    </div>
  );
}
