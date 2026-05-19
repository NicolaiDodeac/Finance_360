import type {
  EvidenceConfidenceLevel,
  EvidenceEvaluation,
  EvidenceFactorResult,
} from "@/lib/evidence/types";

export interface EvidenceLevelLabel {
  short: string;
  description: string;
  badgeVariant: "business" | "secondary" | "warning" | "muted";
}

const LEVEL_LABELS: Record<EvidenceConfidenceLevel, EvidenceLevelLabel> = {
  high: {
    short: "Strong evidence",
    description: "Your records look well supported for this transaction.",
    badgeVariant: "business",
  },
  medium: {
    short: "Good evidence",
    description: "Bank records support this; extra proof is optional.",
    badgeVariant: "secondary",
  },
  low: {
    short: "Basic evidence",
    description: "Bank record only — additional proof may help.",
    badgeVariant: "muted",
  },
  review_recommended: {
    short: "Review recommended",
    description: "Additional proof may help strengthen this record.",
    badgeVariant: "warning",
  },
};

export function getEvidenceLevelLabel(
  level: EvidenceConfidenceLevel
): EvidenceLevelLabel {
  return LEVEL_LABELS[level];
}

function pickSummaryPhrases(factors: EvidenceFactorResult[]): string[] {
  const positive = factors
    .filter((f) => f.scoreDelta > 0)
    .sort((a, b) => b.scoreDelta - a.scoreDelta);
  const negative = factors
    .filter((f) => f.scoreDelta < 0)
    .sort((a, b) => a.scoreDelta - b.scoreDelta);

  const phrases: string[] = [];
  for (const f of positive) {
    if (phrases.length >= 2) break;
    phrases.push(f.phrase.replace(/\.$/, ""));
  }
  if (phrases.length === 0 && negative[0]) {
    phrases.push(negative[0].phrase.replace(/\.$/, ""));
  }
  return phrases;
}

export function buildEvidenceSummary(
  level: EvidenceConfidenceLevel,
  score: number,
  factors: EvidenceFactorResult[]
): EvidenceEvaluation {
  const phrases = pickSummaryPhrases(factors);
  const summary =
    phrases.length > 0
      ? `${phrases.join("; ")}.`
      : getEvidenceLevelLabel(level).description;

  const details = factors.map((f) => f.phrase);

  return {
    level,
    score,
    factors,
    summary,
    details,
  };
}

export function formatEvidenceCount(
  count: number,
  level: EvidenceConfidenceLevel
): string {
  const label = getEvidenceLevelLabel(level).short.toLowerCase();
  return `${count} ${label}`;
}

export const EVIDENCE_EXPLAINER_SECTIONS = [
  {
    title: "Bank statements",
    body: "Imported transactions from your bank or card are useful evidence — they show date, amount, and merchant on your account.",
  },
  {
    title: "Receipts and invoices",
    body: "Linking a receipt or invoice strengthens your records, especially for higher amounts or one-off purchases.",
  },
  {
    title: "Notes and context",
    body: "A short note about business purpose helps explain expenses that are not obvious from the merchant name alone.",
  },
  {
    title: "HMRC categories",
    body: "Assigning an HMRC expense category keeps allowable costs organised and supports your Self Assessment prep.",
  },
] as const;
