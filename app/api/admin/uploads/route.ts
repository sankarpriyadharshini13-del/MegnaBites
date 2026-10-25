import { randomUUID } from "node:crypto";
import { HttpError, handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/guard";
import { BUCKET } from "@/lib/server/model";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1_500_000;

function detect(buf: Buffer, allowSvg: boolean): { ext: string; type: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", type: "image/png" };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { ext: "webp", type: "image/webp" };
  if (allowSvg) {
    const head = buf.toString("utf8", 0, Math.min(buf.length, 400)).trimStart().toLowerCase();
    if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
      const full = buf.toString("utf8").toLowerCase();
      if (/<script|javascript:|\son[a-z]+\s*=|<foreignobject|<iframe/.test(full)) return null;
      return { ext: "svg", type: "image/svg+xml" };
    }
  }
  return null;
}

/** Product photos (kind=product) and the invoice logo (kind=branding) go to the admin-assets bucket. */
export const POST = handle(async (req) => {
  const { client } = await requireAdmin(req);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Upload a file using a multipart form.");
  }
  const file = form.get("file");
  const kind = form.get("kind") === "branding" ? "branding" : "products";
  if (!(file instanceof File)) throw new HttpError(400, "No file was uploaded.");
  if (file.size > MAX_BYTES) throw new HttpError(413, "That image is larger than 1.5 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const info = detect(buf, kind === "branding");
  if (!info) throw new HttpError(400, kind === "branding" ? "Logo must be a PNG, JPG, WebP or SVG image." : "Photos must be JPG, PNG or WebP images.");

  const path = `${kind}/${randomUUID()}.${info.ext}`;
  const { error } = await client.storage.from(BUCKET).upload(path, buf, { contentType: info.type, upsert: false, cacheControl: "31536000" });
  if (error) {
    console.error("[upload]", error.message);
    throw new HttpError(500, "The image couldn't be uploaded. Check that the database setup (storage bucket) has been applied.");
  }
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return json({ url: data.publicUrl }, 201);
});
