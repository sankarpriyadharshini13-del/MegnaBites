"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { getSupabase } from "@/lib/supabase";
import { PENDING_INVITE_KEY } from "@/services/auth";

type Check = { valid: true; name: string | null; email_hint: string } | { valid: false; reason: string };

const REASONS: Record<string, string> = {
  not_found: "This invitation link isn't valid. Ask the store owner for a new one.",
  revoked: "This invitation was cancelled by the store owner.",
  used: "This invitation has already been used.",
  expired: "This invitation has expired. Ask the store owner to send a new one.",
};

export default function InviteContent() {
  const router = useRouter();
  const { user, ready, signOut } = useAuth();
  const { open } = useUI();
  const [token, setToken] = useState<string | null>(null);
  const [check, setCheck] = useState<Check | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(t);
    // Remembered so a brand-new account comes back here after confirming its email (see services/auth.ts).
    try {
      if (t) localStorage.setItem(PENDING_INVITE_KEY, t);
    } catch {
      /* storage unavailable */
    }
    fetch("/api/invites/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t }) })
      .then((r) => r.json())
      .then((d) => {
        const result: Check = d?.valid === true || d?.valid === false ? d : { valid: false, reason: "not_found" };
        if (!result.valid) {
          try {
            localStorage.removeItem(PENDING_INVITE_KEY);
          } catch {
            /* storage unavailable */
          }
        }
        setCheck(result);
      })
      .catch(() => setError("Couldn't check the invitation. Please try again."));
  }, []);

  const accept = async () => {
    setBusy(true);
    setError("");
    const session = (await getSupabase()?.auth.getSession())?.data.session;
    if (!session) {
      setBusy(false);
      return open("account");
    }
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "The invitation couldn't be accepted.");
    try {
      localStorage.removeItem(PENDING_INVITE_KEY);
    } catch {
      /* storage unavailable */
    }
    router.push("/admin");
  };

  return (
    <div className="max-w-lg">
      {!check && !error && <p className="text-ink/60" role="status">Checking your invitation…</p>}
      {check && !check.valid && <p className="text-lg text-ink/70">{REASONS[check.reason] ?? REASONS.not_found}</p>}
      {check?.valid && (
        <>
          <p className="text-lg leading-relaxed text-ink/75">
            {check.name ? `${check.name}, you've` : "You've"} been invited to manage the Magna Eco Bites admin panel. This invitation is for <b>{check.email_hint}</b>.
          </p>
          {!ready ? null : user ? (
            <>
              <p className="mt-3 text-sm text-ink/60">
                Signed in as {user.email}.{" "}
                <button type="button" className="font-semibold text-forest underline-offset-4 hover:text-clay hover:underline" onClick={async () => { await signOut(); setError(""); }}>
                  Not you? Sign out
                </button>
              </p>
              <button type="button" className="btn-primary mt-6" disabled={busy} onClick={accept}>{busy ? "Accepting…" : "Accept invitation"}</button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink/60">
                Sign in (or create an account) with that email address, then accept. New accounts get a confirmation email first — its link brings you back here.
              </p>
              <button type="button" className="btn-primary mt-6" onClick={() => open("account")}>Sign in to accept</button>
            </>
          )}
        </>
      )}
      {error && <p role="alert" className="mt-4 text-sm font-medium text-clay">{error}</p>}
      <p className="mt-8 text-sm"><Link href="/" className="font-semibold text-forest underline-offset-4 hover:text-clay hover:underline">Back to the shop</Link></p>
    </div>
  );
}
