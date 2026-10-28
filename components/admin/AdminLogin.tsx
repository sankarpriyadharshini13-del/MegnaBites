"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Sign-in screen shown at /admin (and every admin URL) until a valid admin session exists.
 * Signing in only proves who you are; the server then checks admin_members before any data loads.
 */
export default function AdminLogin({ notice }: { notice?: string }) {
  const { signIn, sendPasswordReset, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (r.error) setError(r.error);
    // On success the admin shell re-checks access with the server and opens the panel.
  };

  const forgot = async () => {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter your email first, then choose “Forgot password?”.");
    const r = await sendPasswordReset(email);
    if (r.error) setError(r.error);
    else setInfo(`If an admin account exists for ${email.trim()}, a reset link is on its way.`);
  };

  return (
    <div className="adm-loading" style={{ padding: 16 }}>
      <form onSubmit={submit} className="adm-card" style={{ width: "100%", maxWidth: 400, padding: 28 }} noValidate>
        <div className="adm-brand" style={{ padding: 0, marginBottom: 20 }}>
          <div className="adm-logo" aria-hidden="true">M</div>
          <div>
            <b style={{ color: "var(--ink)" }}>Magna Eco Bites</b>
            <span>Admin Console</span>
          </div>
        </div>
        <h1 className="adm-title" style={{ fontSize: 22 }}>Admin sign in</h1>
        <p className="adm-sub" style={{ marginBottom: 18 }}>Only authorised admin accounts can open the panel.</p>
        {notice && <div className="adm-note" style={{ marginBottom: 14 }}>{notice}</div>}
        {!configured ? (
          <p className="adm-err">Login isn&apos;t configured on this site.</p>
        ) : (
          <>
            <div className="adm-fg">
              <label className="adm-fl" htmlFor="al-email">Email</label>
              <input id="al-email" className="adm-in" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="adm-fg">
              <label className="adm-fl" htmlFor="al-pass">Password</label>
              <input id="al-pass" className="adm-in" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="adm-err" role="alert" style={{ marginBottom: 10 }}>{error}</p>}
            {info && <p className="adm-muted" role="status" style={{ marginBottom: 10 }}>{info}</p>}
            <button type="submit" className="adm-btn pri lg" style={{ width: "100%" }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12.5 }}>
              <button type="button" onClick={forgot} style={{ border: 0, background: "none", color: "var(--forest)", fontWeight: 600, padding: 0 }}>Forgot password?</button>
              <Link href="/" style={{ color: "var(--muted)" }}>← Back to the shop</Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
