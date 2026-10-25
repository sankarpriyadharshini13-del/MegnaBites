/** Downscale + re-encode an uploaded photo (JPEG) so uploads stay small and fast to load. */
export async function compressImage(file: File, maxEdge = 1000, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} is larger than 12 MB.`);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
      el.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing isn't available in this browser.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error(`Couldn't process ${file.name}.`);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
