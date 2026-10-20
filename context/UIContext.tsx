"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Panel = "cart" | "search" | "account" | "menu" | null;

interface UIValue {
  panel: Panel;
  open: (p: Exclude<Panel, null>) => void;
  close: () => void;
}
const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [panel, setPanel] = useState<Panel>(null);
  const open = useCallback((p: Exclude<Panel, null>) => setPanel(p), []);
  const close = useCallback(() => setPanel(null), []);
  const value = useMemo(() => ({ panel, open, close }), [panel, open, close]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
