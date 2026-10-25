import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

/**
 * AUTH SERVICE — Supabase Auth (email + password) with a `profiles` table.
 * Schema + RLS live in supabase/migrations/. All functions return
 * `{ error }` with a human-readable message instead of throwing.
 */

/** Set by the /invite page so a new account returns there after confirming its email. */
export const PENDING_INVITE_KEY = "magna-pending-invite";

function confirmRedirect() {
  try {
    const token = window.localStorage.getItem(PENDING_INVITE_KEY);
    if (token) return `${window.location.origin}/invite?token=${encodeURIComponent(token)}`;
  } catch {
    /* storage unavailable */
  }
  return `${window.location.origin}/account`;
}

export const NOT_CONFIGURED = "Login isn't set up yet. Add the Supabase keys to .env.local (see README).";

export interface Result<T = void> {
  data?: T;
  error?: string;
  /** Set when sign-up succeeded but the user must confirm their email first. */
  needsConfirmation?: boolean;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password should be") || m.includes("weak")) return "Password must be at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Network problem. Check your connection and try again.";
  return message;
}

export function toProfile(user: User, row?: { full_name?: string | null; phone?: string | null } | null): UserProfile {
  const meta = (user.user_metadata ?? {}) as { full_name?: string };
  return {
    id: user.id,
    email: user.email ?? "",
    name: row?.full_name || meta.full_name || (user.email ?? "").split("@")[0],
    phone: row?.phone ?? null,
  };
}

async function loadProfile(user: User): Promise<UserProfile> {
  const sb = getSupabase();
  if (!sb) return toProfile(user);
  const { data } = await sb.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
  return toProfile(user, data);
}

export async function getSession(): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user ? loadProfile(data.session.user) : null;
}

export function onAuthChange(cb: (event: AuthChangeEvent, profile: UserProfile | null) => void) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    // Defer: calling Supabase inside this callback can deadlock the auth lock.
    setTimeout(async () => cb(event, session?.user ? await loadProfile(session.user) : null), 0);
  });
  return () => data.subscription.unsubscribe();
}

export async function signUp(name: string, email: string, password: string): Promise<Result> {
  const sb = getSupabase();
  if (!sb) return { error: NOT_CONFIGURED };
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: confirmRedirect(),
    },
  });
  if (error) return { error: friendly(error.message) };
  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) return { error: friendly("already registered") };
  return { needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<Result> {
  const sb = getSupabase();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { error: friendly(error.message) } : {};
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<Result> {
  const sb = getSupabase();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset` });
  return error ? { error: friendly(error.message) } : {};
}

export async function updatePassword(password: string): Promise<Result> {
  const sb = getSupabase();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.updateUser({ password });
  return error ? { error: friendly(error.message) } : {};
}

export async function updateProfile(id: string, fields: { name: string; phone: string }): Promise<Result> {
  const sb = getSupabase();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.from("profiles").upsert({ id, full_name: fields.name.trim(), phone: fields.phone.trim() || null });
  if (error) return { error: error.message };
  await sb.auth.updateUser({ data: { full_name: fields.name.trim() } });
  return {};
}
