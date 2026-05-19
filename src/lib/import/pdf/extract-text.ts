import "pdf-parse/worker";
import { getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

let workerReady = false;

function ensurePdfWorker(): void {
  if (workerReady) {
    return;
  }
  PDFParse.setWorker(getData());
  workerReady = true;
}

/** Extract plain text from a PDF buffer (Node.js server only). */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  ensurePdfWorker();

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}
