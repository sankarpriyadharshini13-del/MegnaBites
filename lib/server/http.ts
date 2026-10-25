import "server-only";
import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export const SCHEMA_MISSING =
  "The database isn't set up yet. Run supabase/migrations/20261025000000_admin_catalog.sql in the Supabase SQL editor.";

interface DbErrorLike {
  code?: string;
  message?: string;
  details?: string;
}

/** Translate a PostgREST / Postgres error into an HttpError without leaking internals. */
export function dbError(e: DbErrorLike | null | undefined, fallback = "Database error"): HttpError {
  const code = e?.code ?? "";
  if (code === "PGRST205" || code === "42P01" || code === "PGRST202" || code === "42883") {
    return new HttpError(503, SCHEMA_MISSING, "schema_missing");
  }
  if (code === "42501") return new HttpError(403, "You don't have permission to do that.");
  if (code === "23505") return new HttpError(409, "That value already exists.");
  if (code === "23503") return new HttpError(409, "That record is still in use.");
  if (code === "23514" || code === "22P02" || code === "22001") return new HttpError(400, "Some of the values are not valid.");
  console.error("[db]", code, e?.message);
  return new HttpError(500, fallback);
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler so thrown HttpErrors become JSON error responses. */
export function handle<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.message, code: e.code }, e.status);
      }
      console.error("[api]", e);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/** Reads a JSON body with a size cap; throws 400 on garbage. */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 200_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "That request is too large.");
  try {
    const parsed = JSON.parse(text || "{}");
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    return parsed as T;
  } catch {
    throw new HttpError(400, "The request body isn't valid JSON.");
  }
}
