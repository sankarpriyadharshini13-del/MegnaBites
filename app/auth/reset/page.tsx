"use client";

import Link from "next/link";
import { useState } from "react";
import SiteShell from "@/components/layout/SiteShell";
import PasswordField from "@/components/auth/PasswordField";
import { useAuth } from "@/context/AuthContext";

function ResetForm() {
  const { user, ready, recovering, updatePassword } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done)
    return (
      <div className="max-w-md">
        <p role="status" className="text-lg text-forest">Your password has been updated.</p>
        <Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  if (!ready) return <p className="text-ink/60" role="status">Checking your link…</p>;
  if (!recovering && !user)
    return <p className="max-w-md text-lg text-ink/70">This reset link is invalid or has expired. Use “Forgot password?” in the sign-in window to get a new one.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setError("Password must be at least 8 characters.");
    if (pw !== pw2) return setError("Passwords don't match.");
    setBusy(true);
    const r = await updatePassword(pw);
    setBusy(false);
    r.error ? setError(r.error) : setDone(true);
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-md space-y-4">
      <PasswordField id="new-pw" label="New password" value={pw} onChange={setPw} autoComplete="new-password" hint="At least 8 characters." />
      <PasswordField id="new-pw2" label="Confirm new password" value={pw2} onChange={setPw2} autoComplete="new-password" />
      {error && <p role="alert" className="text-sm font-medium text-clay">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Saving…" : "Update password"}</button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <h1 className="mb-10 font-display text-4xl text-forest md:text-5xl">Set a new <span className="italic text-clay">password</span></h1>
        <ResetForm />
      </section>
    </SiteShell>
  );
}
