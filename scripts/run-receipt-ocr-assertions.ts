import { parseReceiptText } from "../src/lib/receipts/ocr/parse-text";
import {
  detectKnownMerchant,
  extractMerchantFromReceiptText,
} from "../src/lib/receipts/ocr/extract-merchant";

/** Simulates wrinkled-receipt OCR: garbage header line + real Tesco token. */
const TESCO_WRINKLED_OCR = `
SHA ENE RUHR FE SER RE 8 PL REHTES
TESC0 EXPRESS
12/05/2026 14:32
TOTAL £7.56
VAT £1.26
CONTACTLESS
Thank you
`;

const TESCO_CLEAN_OCR = `
TESCO METRO
High Street
22/05/2026
Total 7.56
`;

const TESCO_COMPACT_OCR = `
noise noise noise
Customer copy TESCOSTORE 12345
Amount Due GBP 7.56
`;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const wrinkled = parseReceiptText(TESCO_WRINKLED_OCR);
assert(wrinkled.merchant === "Tesco", `wrinkled receipt: expected Tesco, got ${wrinkled.merchant}`);
assert(
  wrinkled.merchantSource === "known",
  `wrinkled receipt: expected known source, got ${wrinkled.merchantSource}`
);
assert(wrinkled.knownMerchantId === "tesco", "wrinkled receipt: expected tesco id");
assert(
  wrinkled.rawText?.includes("SHA ENE RUHR") === true,
  "raw OCR text should be preserved for audit"
);

const clean = parseReceiptText(TESCO_CLEAN_OCR);
assert(clean.merchant === "Tesco", `clean receipt: expected Tesco, got ${clean.merchant}`);

const compact = parseReceiptText(TESCO_COMPACT_OCR);
assert(compact.merchant === "Tesco", `compact TESCO: expected Tesco, got ${compact.merchant}`);

const fuzzy = detectKnownMerchant("Payment at TESGO FUEL station");
assert(fuzzy?.displayName === "Tesco", "TESGO fuzzy variant should match Tesco");

const garbageOnly = extractMerchantFromReceiptText(
  "SHA ENE RUHR FE SER RE 8 PL REHTES ONLY NOISE"
);
assert(
  garbageOnly.merchant === null || garbageOnly.source !== "known",
  "pure garbage without brand token should not be a known merchant"
);

console.log("Receipt OCR assertions passed.");
