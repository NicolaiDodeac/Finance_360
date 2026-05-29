/**
 * OCR-only image preprocessing.
 *
 * IMPORTANT: this never touches the stored original receipt. The original
 * uploaded bytes are the audit evidence and must stay byte-for-byte unchanged.
 * Preprocessing only runs on an in-memory copy that is fed to the OCR engine.
 *
 * Steps (all best-effort — any failure falls back to the input buffer so OCR
 * still runs):
 *   - downscale very large photos to a sensible OCR size
 *   - grayscale
 *   - contrast normalisation
 *   - light sharpen
 *
 * The pipeline is intentionally modular so the OCR engine and these steps can
 * be swapped for a better service later without changing callers.
 */

export interface PreprocessOptions {
  /** Longest edge after downscale. Larger keeps detail but is slower. */
  maxEdge?: number;
  grayscale?: boolean;
  /** Stretch contrast so faint thermal print is readable. */
  normalize?: boolean;
  sharpen?: boolean;
}

export interface PreprocessResult {
  buffer: Buffer;
  /** True when sharp ran and produced an enhanced buffer. */
  enhanced: boolean;
  /** Operations actually applied (for audit / debugging). */
  applied: string[];
  error?: string;
}

const DEFAULT_OPTIONS: Required<PreprocessOptions> = {
  maxEdge: 2200,
  grayscale: true,
  normalize: true,
  sharpen: true,
};

/** Image MIME types worth preprocessing with sharp. */
const PREPROCESSABLE = /^image\/(jpeg|jpg|png|webp|tiff|heic|heif)$/i;

export function shouldPreprocessImage(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return PREPROCESSABLE.test(mimeType.toLowerCase());
}

/**
 * Enhance an image buffer for OCR. Returns the original buffer unchanged if
 * preprocessing is not applicable or fails.
 */
export async function preprocessImageForOcr(
  buffer: Buffer,
  mimeType: string | null,
  options?: PreprocessOptions
): Promise<PreprocessResult> {
  if (!shouldPreprocessImage(mimeType)) {
    return { buffer, enhanced: false, applied: [] };
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const applied: string[] = [];

  try {
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(buffer, { failOn: "none" }).rotate();
    applied.push("auto-orient");

    const metadata = await sharp(buffer, { failOn: "none" }).metadata();
    const longestEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
    if (longestEdge > opts.maxEdge) {
      pipeline = pipeline.resize({
        width: metadata.width && metadata.width >= (metadata.height ?? 0) ? opts.maxEdge : undefined,
        height: metadata.height && (metadata.height > (metadata.width ?? 0)) ? opts.maxEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
      applied.push(`resize<=${opts.maxEdge}`);
    }

    if (opts.grayscale) {
      pipeline = pipeline.grayscale();
      applied.push("grayscale");
    }
    if (opts.normalize) {
      pipeline = pipeline.normalize();
      applied.push("normalize");
    }
    if (opts.sharpen) {
      pipeline = pipeline.sharpen();
      applied.push("sharpen");
    }

    const out = await pipeline.png().toBuffer();
    return { buffer: out, enhanced: true, applied };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image preprocessing failed.";
    // Never block OCR on preprocessing — fall back to the input buffer.
    return { buffer, enhanced: false, applied, error: message };
  }
}
