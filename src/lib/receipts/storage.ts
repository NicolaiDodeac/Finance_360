import {
  ALLOWED_RECEIPT_EXTENSIONS,
  ALLOWED_RECEIPT_MIME_TYPES,
} from "@/lib/receipts/constants";

export function taxYearFolderSegment(label: string | null | undefined): string {
  if (!label?.trim()) return "unknown";
  return label.trim().replace(/\//g, "-");
}

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "receipt";
  const cleaned = base
    .replace(/[^\w.\-()+ ]/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 120);
  return cleaned || "receipt";
}

export function buildReceiptStoragePath(
  userId: string,
  taxYearLabel: string | null | undefined,
  originalFilename: string
): string {
  const folder = taxYearFolderSegment(taxYearLabel);
  const timestamp = Date.now();
  const safeName = sanitizeFilename(originalFilename);
  return `${userId}/${folder}/${timestamp}-${safeName}`;
}

export function isAllowedReceiptFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime && ALLOWED_RECEIPT_MIME_TYPES.has(mime)) {
    return true;
  }

  const ext = getFileExtension(file.name);
  return ALLOWED_RECEIPT_EXTENSIONS.has(ext);
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

export function guessMimeType(filename: string, fallback?: string): string {
  if (fallback && ALLOWED_RECEIPT_MIME_TYPES.has(fallback.toLowerCase())) {
    return fallback.toLowerCase();
  }

  const ext = getFileExtension(filename);
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    default:
      return fallback ?? "application/octet-stream";
  }
}

export function isImageMimeType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export function isPdfMimeType(mimeType: string | null | undefined): boolean {
  return mimeType === "application/pdf";
}
