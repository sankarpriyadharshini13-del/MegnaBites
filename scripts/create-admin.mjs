#!/usr/bin/env node
/**
 * One-time setup: creates (or updates) the store owner's Supabase Auth account and marks it as the
 * single owner in public.admin_members. Credentials come from environment variables only — they are
 * never stored in the repository. Supabase Auth stores the password as a bcrypt hash.
 *
 *   PowerShell:
 *     $env:SUPABASE_SERVICE_ROLE_KEY="<service_role key from Supabase → Project Settings → API>"
 *     $env:ADMIN_EMAIL="owner@example.com"; $env:ADMIN_PASSWORD="<password>"; $env:ADMIN_NAME="Magesh"
 *     node --env-file=.env scripts/create-admin.mjs
 *
 * Changing the owner's email later: run it again with the NEW ADMIN_EMAIL and ALLOW_OWNER_EMAIL_CHANGE=1.
 * The same account (and its password, if you give a new one) keeps owner access under the new address.
 *
 * The service-role key bypasses row-level security: keep it out of .env files that are committed and
 * never prefix it with NEXT_PUBLIC_.
 */
import { createClient } from "@supabase/supabase-js";

class Stop extends Error {}
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  throw new Stop(msg);
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "").trim() || email.split("@")[0];
  const allowChange = process.env.ALLOW_OWNER_EMAIL_CHANGE === "1";

  if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is missing (run with --env-file=.env).");
  for (const [k, v] of [["SUPABASE_SERVICE_ROLE_KEY", serviceKey], ["ADMIN_EMAIL", email], ["ADMIN_PASSWORD", password]]) {
    if (/[<>]/.test(v)) fail(`${k} still contains placeholder text like <...>. Replace it with the real value (no angle brackets).`);
  }
  if (serviceKey.length < 30 || /\s/.test(serviceKey)) fail("SUPABASE_SERVICE_ROLE_KEY is missing or doesn't look like a real key (Project Settings → API → service_role).");
  if (serviceKey.startsWith("eyJ")) {
    try {
      const role = JSON.parse(Buffer.from(serviceKey.split(".")[1], "base64url").toString()).role;
      if (role !== "service_role") fail(`That key has the role "${role}". Use the service_role key, not the anon/public key.`);
    } catch (e) {
      if (e instanceof Stop) throw e;
      fail("SUPABASE_SERVICE_ROLE_KEY isn't a valid key.");
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("ADMIN_EMAIL is missing or invalid.");
  if (password.length < 8) fail("ADMIN_PASSWORD must be at least 8 characters.");

  const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  async function findUserByEmail(addr) {
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (error) fail(`Couldn't list users: ${error.message}`);
      const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === addr);
      if (hit) return hit;
      if (data.users.length < 200) return null;
    }
    return null;
  }

  const { data: owner, error: ownerErr } = await sb.from("admin_members").select("user_id, email").eq("role", "owner").maybeSingle();
  if (ownerErr) fail(`Couldn't read admin_members (did you run the SQL migration?): ${ownerErr.message}`);

  let userId;
  if (owner && owner.email.toLowerCase() !== email) {
    // Changing the owner's email address.
    if (!allowChange) {
      fail(`${owner.email} is already the owner. To change the owner's email to ${email}, run again with ALLOW_OWNER_EMAIL_CHANGE=1.`);
    }
    if (await findUserByEmail(email)) fail(`Another account already uses ${email}. Pick a different address.`);
    const { error } = await sb.auth.admin.updateUserById(owner.user_id, { email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (error) fail(`Couldn't change the owner's email: ${error.message}`);
    userId = owner.user_id;
    console.log(`✔ Owner email changed from ${owner.email} to ${email}`);
  } else {
    let user = owner ? { id: owner.user_id, user_metadata: {} } : await findUserByEmail(email);
    if (user) {
      const { error } = await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { ...user.user_metadata, full_name: name } });
      if (error) fail(`Couldn't update the existing account: ${error.message}`);
      console.log(`✔ Updated existing account ${email}`);
    } else {
      const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
      if (error) fail(`Couldn't create the account: ${error.message}`);
      user = data.user;
      console.log(`✔ Created account ${email}`);
    }
    userId = user.id;
  }

  const { error: upErr } = await sb.from("admin_members").upsert({ user_id: userId, email, name, role: "owner" });
  if (upErr) fail(`Couldn't grant owner access: ${upErr.message}`);
  console.log(`✔ ${email} is the store owner and can open /admin`);
}

// Set the exit code instead of calling process.exit(): avoids a harmless but ugly Node crash message on Windows.
main().catch((e) => {
  if (!(e instanceof Stop)) console.error("✖ Unexpected error:", e?.message ?? e);
  process.exitCode = 1;
});
