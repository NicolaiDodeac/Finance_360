/** Normalise HEIC/HEIF and other formats to a buffer Tesseract can read. */
export async function prepareImageBufferForOcr(
  buffer: Buffer,
  mimeType: string | null
): Promise<{ buffer: Buffer; mimeType: string; error?: string }> {
  const mime = (mimeType ?? "").toLowerCase();

  if (mime === "image/heic" || mime === "image/heif") {
    try {
      const sharp = (await import("sharp")).default;
      const converted = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
      return { buffer: converted, mimeType: "image/jpeg" };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not convert photo format.";
      return {
        buffer,
        mimeType: mime,
        error: `This photo format (HEIC) could not be converted for scanning. ${message}`,
      };
    }
  }

  return { buffer, mimeType: mime || "image/jpeg" };
}
