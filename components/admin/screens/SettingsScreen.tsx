"use client";

import { useRef, useState } from "react";
import { signIn, updatePassword } from "@/services/auth";
import { fmtDate } from "@/lib/admin/format";
import { useAdminData } from "@/lib/admin/store";
import type { Invite, Settings } from "@/lib/admin/types";
import { Badge, MaskedInput, Modal, ToggleRow, Topbar } from "../ui";

const clone = (s: Settings): Settings => JSON.parse(JSON.stringify(s));

export default function SettingsScreen() {
  const { data, api, mutate, uploadImage, toast, refresh } = useAdminData();
  const [draft, setDraft] = useState<Settings>(() => clone(data.settings));
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState(false);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [pwd, setPwd] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const isOwner = data.me.role === "owner";
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);

  const upd = <K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] as object), ...patch } }));

  const save = async () => {
    setSaving(true);
    await mutate("/api/admin/settings", "PUT", draft, "Settings saved.");
    setSaving(false);
  };

  const onLogo = async (file?: File) => {
    if (!file) return;
    const res = await uploadImage(file, "branding");
    if (res.ok && res.data) upd("invoice", { logo: res.data.url });
  };

  const rz = draft.razorpay;
  const n = draft.notifications;
  const pending = data.invites.filter((i) => i.status === "pending");

  return (
    <>
      <Topbar title="Settings" subtitle="Store details, payments and who can access the panel">
        <button type="button" className="adm-btn pri lg" onClick={save} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</button>
      </Topbar>

      <div className="s-grid">
        <section className="adm-card">
          <div className="adm-card-h"><h2>Store profile</h2></div>
          <div className="adm-row2 adm-fg">
            <div><label className="adm-fl" htmlFor="st-name">Store name</label><input id="st-name" className="adm-in" value={draft.store.name} onChange={(e) => upd("store", { name: e.target.value })} /></div>
            <div><label className="adm-fl" htmlFor="st-owner">Owner</label><input id="st-owner" className="adm-in" value={draft.store.owner} onChange={(e) => upd("store", { owner: e.target.value })} /></div>
          </div>
          <div className="adm-fg"><label className="adm-fl" htmlFor="st-addr">Pickup &amp; business address</label><input id="st-addr" className="adm-in" value={draft.store.address} onChange={(e) => upd("store", { address: e.target.value })} /></div>
          <div className="adm-row2 adm-fg">
            <div>
              <label className="adm-fl">Phone</label>
              <MaskedInput label="Phone" value={draft.store.phone} mask={() => "+91 ••••• •••••"} placeholder="+91 ••••• •••••" onChange={(v) => upd("store", { phone: v })} />
            </div>
            <div><label className="adm-fl" htmlFor="st-mail">Email</label><input id="st-mail" className="adm-in" type="email" value={draft.store.email} onChange={(e) => upd("store", { email: e.target.value })} /></div>
          </div>
          <div className="adm-row2 adm-fg">
            <div><label className="adm-fl" htmlFor="st-gst">GSTIN (optional)</label><input id="st-gst" className="adm-in" placeholder="Add when available" value={draft.store.gstin} onChange={(e) => upd("store", { gstin: e.target.value.toUpperCase() })} /></div>
            <div><label className="adm-fl" htmlFor="st-udy">Udyam no. (optional)</label><input id="st-udy" className="adm-in" placeholder="Add when available" value={draft.store.udyam} onChange={(e) => upd("store", { udyam: e.target.value.toUpperCase() })} /></div>
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Payments — Razorpay</h2></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <b style={{ color: "var(--ink)" }}>Mode</b>
            <button type="button" className={`s-pill ${rz.mode === "Live" ? "green" : "gray"}`} onClick={() => upd("razorpay", { mode: rz.mode === "Live" ? "Test" : "Live" })} aria-label={`Razorpay mode: ${rz.mode}. Click to switch.`}>
              {rz.mode}
            </button>
          </div>
          <ToggleRow label="UPI" checked={rz.upi} onChange={(v) => upd("razorpay", { upi: v })} />
          <ToggleRow label="Cards" checked={rz.cards} onChange={(v) => upd("razorpay", { cards: v })} />
          <ToggleRow label="NetBanking" checked={rz.netbanking} onChange={(v) => upd("razorpay", { netbanking: v })} />
          <ToggleRow label="Cash on delivery" checked={rz.cod} onChange={(v) => upd("razorpay", { cod: v })} />
          <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
            <label className="adm-fl" htmlFor="rz-acct">Payout account</label>
            <input id="rz-acct" className="adm-in" placeholder="e.g. HDFC •••• 4821" value={rz.payoutAccount} onChange={(e) => upd("razorpay", { payoutAccount: e.target.value })} />
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Notifications</h2></div>
          <ToggleRow label="Email me on every new order" checked={n.newOrder} onChange={(v) => upd("notifications", { newOrder: v })} />
          <ToggleRow label="Low-stock alerts (≤ 10 units)" checked={n.lowStock} onChange={(v) => upd("notifications", { lowStock: v })} />
          <ToggleRow label="Order confirmation & delivery emails to customer" checked={n.orderEmail} onChange={(v) => upd("notifications", { orderEmail: v })} />
          <ToggleRow label="WhatsApp updates to customer" checked={n.whatsapp} onChange={(v) => upd("notifications", { whatsapp: v })} />
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Invoice &amp; branding</h2></div>
          <div className="s-logo">
            <div className="p-big" style={draft.invoice.logo ? { backgroundImage: `url(${draft.invoice.logo})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "#fff", border: "1px solid var(--line)" } : undefined}>
              {draft.invoice.logo ? "" : (draft.store.name.charAt(0).toUpperCase() || "M")}
            </div>
            <div
              className="p-drop"
              role="button"
              tabIndex={0}
              style={{ flex: 1 }}
              onClick={() => logoRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && logoRef.current?.click()}
            >
              <div><b>{draft.invoice.logo ? "Replace logo" : "Upload logo"}</b> · PNG or SVG</div>
              <input ref={logoRef} type="file" accept="image/png,image/svg+xml" hidden onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>
          {draft.invoice.logo && (
            <button type="button" className="adm-btn sm" style={{ marginBottom: 12 }} onClick={() => upd("invoice", { logo: null })}>Remove logo</button>
          )}
          <div className="adm-fg"><label className="adm-fl" htmlFor="iv-foot">Invoice footer text</label><textarea id="iv-foot" className="adm-ta" rows={2} value={draft.invoice.footer} onChange={(e) => upd("invoice", { footer: e.target.value })} /></div>
          <div className="adm-fg"><label className="adm-fl" htmlFor="iv-fmt">Invoice number format</label><input id="iv-fmt" className="adm-in" value={draft.invoice.numberFormat} onChange={(e) => upd("invoice", { numberFormat: e.target.value })} /></div>
        </section>

        <section className="adm-card">
          <div className="adm-card-h"><h2>Team &amp; access</h2></div>
          {data.members.map((m) => (
            <div className="s-team" key={m.userId}>
              <div className="c-av" style={m.role === "owner" ? { background: "var(--sb)" } : undefined}>{(m.name || m.email).charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <b>{m.name || m.email.split("@")[0]}{m.userId === data.me.userId ? " (you)" : ""}</b>
                <span className="sub">{m.email}</span>
              </div>
              <Badge tone={m.role === "owner" ? "yellow" : "blue"}>{m.role === "owner" ? "Owner" : "Admin"}</Badge>
              {isOwner && m.role === "admin" && (
                <button type="button" className="adm-x" aria-label={`Remove ${m.email}`} title="Remove access" style={{ width: 24, height: 24, fontSize: 16 }} onClick={() => mutate(`/api/admin/members/${m.userId}`, "DELETE", undefined, `${m.email} no longer has admin access.`)}>×</button>
              )}
            </div>
          ))}
          {pending.map((i: Invite) => (
            <div className="s-team" key={i.id}>
              <div className="c-av" style={{ background: "#9aa39a" }}>✉</div>
              <div style={{ minWidth: 0 }}>
                <b>{i.name || i.email.split("@")[0]}</b>
                <span className="sub">{i.email} · invited · expires {fmtDate(i.expiresAt)}</span>
              </div>
              <Badge tone="gray">Invited</Badge>
              {isOwner && (
                <button
                  type="button"
                  className="adm-btn sm"
                  title="Create a fresh link (the old one stops working)"
                  onClick={async () => {
                    const res = await api<{ invite: Invite; link: string }>("/api/admin/invites", { method: "POST", body: { email: i.email, name: i.name ?? "", replace: true } });
                    if (!res.ok || !res.data) return toast(res.error ?? "Couldn't create a new link.", "error");
                    await refresh();
                    setLink({ email: i.email, url: res.data.link });
                  }}
                >
                  New link
                </button>
              )}
              {isOwner && (
                <button type="button" className="adm-x" aria-label={`Revoke invitation for ${i.email}`} title="Revoke invitation" style={{ width: 24, height: 24, fontSize: 16 }} onClick={() => mutate(`/api/admin/invites/${i.id}`, "DELETE", undefined, "Invitation revoked.")}>×</button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, margin: "14px 0", flexWrap: "wrap" }}>
            {isOwner && <button className="adm-btn" onClick={() => setInvite(true)}>+ Invite team member</button>}
            <button className="adm-btn" onClick={() => setPwd(true)}>Change password</button>
          </div>
          <div className="adm-note">
            {isOwner
              ? "Admin access is limited to you and the people you invite. Invitation links work once, for the invited email only."
              : "Admin access is limited to the owner and the people they invite."}
          </div>
        </section>
      </div>

      {invite && (
        <InviteModal
          onClose={() => setInvite(false)}
          onCreate={async (email, name) => {
            const res = await api<{ invite: Invite; link: string }>("/api/admin/invites", { method: "POST", body: { email, name } });
            if (!res.ok || !res.data) return res.error ?? "The invitation couldn't be created.";
            await refresh();
            setLink({ email, url: res.data.link });
            return null;
          }}
        />
      )}
      {link && <LinkModal email={link.email} url={link.url} onClose={() => setLink(null)} onCopied={() => toast("Invitation link copied.")} />}
      {pwd && <PasswordModal email={data.me.email} onClose={() => setPwd(false)} onDone={() => toast("Password updated.")} />}
    </>
  );
}

function InviteModal({ onCreate, onClose }: { onCreate: (email: string, name: string) => Promise<string | null>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr("Enter a valid email address.");
    setBusy(true);
    const problem = await onCreate(email.trim(), name.trim());
    setBusy(false);
    if (problem) return setErr(problem);
    onClose();
  };
  return (
    <Modal title="Invite team member" onClose={onClose} footer={<><button className="adm-btn" onClick={onClose}>Cancel</button><button className="adm-btn pri" onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create invitation"}</button></>}>
      <div className="adm-fg"><label className="adm-fl" htmlFor="iv-n">Name (optional)</label><input id="iv-n" className="adm-in" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} /></div>
      <div className="adm-fg"><label className="adm-fl" htmlFor="iv-e">Email</label><input id="iv-e" className="adm-in" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
      {err && <p className="adm-err">{err}</p>}
      <p className="adm-muted" style={{ marginTop: 8 }}>They get full admin access once they sign in with this email and open the invitation link.</p>
    </Modal>
  );
}

function LinkModal({ email, url, onClose, onCopied }: { email: string; url: string; onClose: () => void; onCopied: () => void }) {
  return (
    <Modal title="Invitation created" onClose={onClose} footer={<button className="adm-btn pri" onClick={onClose}>Done</button>}>
      <p style={{ lineHeight: 1.55, marginBottom: 10 }}>Send this link to <b>{email}</b>. It works once, only for that email, and expires in 7 days. It won&apos;t be shown again.</p>
      <input className="adm-in" readOnly value={url} aria-label="Invitation link" onFocus={(e) => e.currentTarget.select()} />
      <button
        className="adm-btn sm"
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            onCopied();
          } catch {
            /* clipboard blocked — the field is selectable */
          }
        }}
      >
        Copy link
      </button>
    </Modal>
  );
}

function PasswordModal({ email, onDone, onClose }: { email: string; onDone: () => void; onClose: () => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!cur) return setErr("Enter your current password.");
    if (next.length < 8) return setErr("Use at least 8 characters.");
    if (next !== again) return setErr("The new passwords don't match.");
    setBusy(true);
    // Re-authenticate with the current password, then let Supabase Auth store the new one (hashed).
    const check = await signIn(email, cur);
    if (check.error) {
      setBusy(false);
      return setErr("Current password is incorrect.");
    }
    const res = await updatePassword(next);
    setBusy(false);
    if (res.error) return setErr(res.error);
    onDone();
    onClose();
  };
  return (
    <Modal title="Change password" onClose={onClose} footer={<><button className="adm-btn" onClick={onClose}>Cancel</button><button className="adm-btn pri" onClick={submit} disabled={busy}>{busy ? "Updating…" : "Update password"}</button></>}>
      <div className="adm-fg"><label className="adm-fl" htmlFor="pw-c">Current password</label><input id="pw-c" className="adm-in" type="password" autoComplete="current-password" value={cur} onChange={(e) => { setCur(e.target.value); setErr(""); }} /></div>
      <div className="adm-fg"><label className="adm-fl" htmlFor="pw-n">New password</label><input id="pw-n" className="adm-in" type="password" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setErr(""); }} /></div>
      <div className="adm-fg"><label className="adm-fl" htmlFor="pw-a">Confirm new password</label><input id="pw-a" className="adm-in" type="password" autoComplete="new-password" value={again} onChange={(e) => { setAgain(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
      {err && <p className="adm-err">{err}</p>}
    </Modal>
  );
}
