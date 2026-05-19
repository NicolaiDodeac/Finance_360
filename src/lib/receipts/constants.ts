export const RECEIPTS_BUCKET = "receipts";

export const MAX_RECEIPT_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
]);

export const ALLOWED_RECEIPT_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
]);

export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
