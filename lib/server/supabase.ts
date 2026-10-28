import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

/** Route handlers and server components must never serve cached database reads. */
const noStore: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

/** Anonymous client: can only do what the `anon` role is allowed to (visible products, invite pre-check). */
export function anonClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  return createClient(url, anonKey, { auth: authOptions, global: { fetch: noStore } });
}

/**
 * Client acting as the signed-in user. Row-level security therefore still applies to every query,
 * on top of the explicit role checks in lib/server/guard.ts.
 */
export function userClient(accessToken: string): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  return createClient(url, anonKey, {
    auth: authOptions,
    global: { fetch: noStore, headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export const publicUrl = url ?? "";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const serviceConfigured = Boolean(url && serviceKey);

/**
 * Service-role client: bypasses row-level security. Used ONLY by checkout routes after the payment has
 * been verified with Razorpay (no user session exists for webhooks). Never expose this key to the browser.
 */
export function serviceClient(): SupabaseClient {
  if (!url || !serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(url, serviceKey, { auth: authOptions, global: { fetch: noStore } });
}
