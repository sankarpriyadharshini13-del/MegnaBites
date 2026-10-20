"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/components/layout/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";

function AccountContent() {
  const { user, ready, configured, updateProfile, signOut } = useAuth();
  const { open } = useUI();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) { setName(user.name); setPhone(user.phone ?? ""); } }, [user]);

  if (!ready) return <p className="text-ink/60" role="status">Loading…</p>;
  if (!user)
    return (
      <div className="max-w-md">
        <p className="text-lg text-ink/70">{configured ? "Sign in to view and edit your details." : "Login isn't set up yet."}</p>
        {configured && <button type="button" className="btn-primary mt-6" onClick={() => open("account")}>Sign in</button>}
      </div>
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: "Please enter your name." });
    setBusy(true);
    const r = await updateProfile({ name, phone });
    setBusy(false);
    setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: "Details saved." });
  };

  return (
    <form onSubmit={save} className="max-w-md space-y-4" noValidate>
      <div>
        <label htmlFor="p-email" className="mb-1.5 block text-sm font-semibold text-forest">Email</label>
        <input id="p-email" className="field opacity-70" value={user.email} readOnly />
      </div>
      <div>
        <label htmlFor="p-name" className="mb-1.5 block text-sm font-semibold text-forest">Full name</label>
        <input id="p-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="p-phone" className="mb-1.5 block text-sm font-semibold text-forest">Phone (optional)</label>
        <input id="p-phone" type="tel" className="field" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-medium ${msg.ok ? "text-leaf" : "text-clay"}`}>{msg.text}</p>}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
        <button type="button" className="btn-secondary" onClick={signOut}>Sign out</button>
      </div>
    </form>
  );
}

export default function AccountPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 md:py-20 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay sm:text-xs">Account</p>
        <h1 className="mb-8 mt-2 font-display text-3xl text-forest sm:mb-10 sm:mt-3 sm:text-4xl md:text-5xl">Your <span className="italic text-clay">details</span></h1>
        <AccountContent />
      </section>
    </SiteShell>
  );
}
