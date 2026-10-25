"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { orderLabel } from "./format";
import type { AdminData } from "./types";

export type ToastTone = "ok" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export type AdminStatus = "loading" | "signed-out" | "forbidden" | "error" | "ready";

export interface ApiResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface AdminContextValue {
  status: AdminStatus;
  errorMessage: string;
  data: AdminData | null;
  /** Current time, refreshed every minute so "settled" / relative labels stay honest. */
  now: Date;
  label: (orderNumber: number) => string;
  toast: (message: string, tone?: ToastTone) => void;
  toasts: ToastItem[];
  dismissToast: (id: number) => void;
  /** Re-read everything from the database. */
  refresh: () => Promise<void>;
  /** Authenticated call to the admin API. Doesn't toast and doesn't refresh. */
  api: <T = unknown>(path: string, init?: { method?: string; body?: unknown; form?: FormData }) => Promise<ApiResult<T>>;
  /** Call the API, toast the outcome, and refresh the data on success. */
  mutate: <T = unknown>(
    path: string,
    method: "POST" | "PUT" | "DELETE",
    body?: unknown,
    success?: string | ((data: T) => string),
  ) => Promise<ApiResult<T>>;
  uploadImage: (file: Blob, kind: "product" | "branding") => Promise<ApiResult<{ url: string }>>;
  retry: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

async function accessToken(): Promise<string | null> {
  const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
  return data.session?.access_token ?? null;
}

async function call<T>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<ApiResult<T> & { status: number }> {
  const token = await accessToken();
  if (!token) return { ok: false, status: 401, error: "Please sign in." };
  try {
    const res = await fetch(path, {
      method: init.method ?? "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: (json as { error?: string }).error ?? "Something went wrong." };
    return { ok: true, status: res.status, data: json as T };
  } catch {
    return { ok: false, status: 0, error: "Network problem. Check your connection and try again." };
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message: string, tone: ToastTone = "ok") => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone }]);
      setTimeout(() => dismissToast(id), tone === "error" ? 6000 : 3500);
    },
    [dismissToast],
  );

  const load = useCallback(async () => {
    const res = await call<AdminData>("/api/admin/data");
    if (res.ok && res.data) {
      setData(res.data);
      setStatus("ready");
    } else if (res.status === 401) {
      setData(null);
      setStatus("signed-out");
    } else if (res.status === 403) {
      setData(null);
      setStatus("forbidden");
    } else {
      setErrorMessage(res.error ?? "The admin data couldn't be loaded.");
      setStatus("error");
    }
  }, []);

  // Re-evaluate access whenever the signed-in user changes.
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setData(null);
      setStatus("signed-out");
      return;
    }
    setStatus("loading");
    load();
  }, [ready, user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const api = useCallback<AdminContextValue["api"]>(async (path, init) => {
    const res = await call(path, init);
    if (res.status === 401) {
      // The session ended while the page was open.
      setStatus("signed-out");
      setData(null);
    } else if (res.status === 403) {
      // A 403 can simply mean "owner only". Leave the panel only if admin access itself is gone.
      const me = await call("/api/admin/me");
      if (me.status === 401 || me.status === 403) {
        setStatus(me.status === 401 ? "signed-out" : "forbidden");
        setData(null);
      }
    }
    return res as ApiResult<never>;
  }, []);

  const mutate = useCallback<AdminContextValue["mutate"]>(
    async (path, method, body, success) => {
      const res = await api(path, { method, body: body ?? (method === "DELETE" ? undefined : {}) });
      if (!res.ok) {
        toast(res.error ?? "Something went wrong.", "error");
        return res as ApiResult<never>;
      }
      await load();
      const msg = typeof success === "function" ? success(res.data as never) : success;
      if (msg) toast(msg);
      return res as ApiResult<never>;
    },
    [api, load, toast],
  );

  const uploadImage = useCallback<AdminContextValue["uploadImage"]>(
    async (file, kind) => {
      const form = new FormData();
      form.append("file", file, kind === "branding" ? "logo" : "photo");
      form.append("kind", kind);
      const res = await api<{ url: string }>("/api/admin/uploads", { method: "POST", form });
      if (!res.ok) toast(res.error ?? "Upload failed.", "error");
      return res;
    },
    [api, toast],
  );

  const format = data?.settings.invoice.numberFormat ?? "MEB-0000";
  const label = useCallback((n: number) => orderLabel(n, format), [format]);

  const value = useMemo<AdminContextValue>(
    () => ({
      status,
      errorMessage,
      data,
      now,
      label,
      toast,
      toasts,
      dismissToast,
      refresh: load,
      api,
      mutate,
      uploadImage,
      retry: () => {
        setStatus("loading");
        load();
      },
    }),
    [status, errorMessage, data, now, label, toast, toasts, dismissToast, load, api, mutate, uploadImage],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

/** Same as useAdmin but guarantees data (screens render only once the shell has loaded it). */
export function useAdminData() {
  const ctx = useAdmin();
  return { ...ctx, data: ctx.data as AdminData };
}
