import { mergeAssistantMetadata } from "@/lib/categorization/assistant-metadata";
import { inferFlowTypeFromCategorySlug } from "@/lib/categorization/categorise-flow/flow-mappings";
import type { FlowType } from "@/lib/transactions/flow-type";
import { isFlowType } from "@/lib/transactions/flow-type";

/** Attach flow_type to assistant metadata when a rule assigns a category (no DB column). */
export function mergeRuleFlowTypeMetadata(
  raw: Record<string, unknown> | null | undefined,
  options: {
    categorySlug?: string | null;
    direction: string;
    isBusiness: boolean;
  }
): Record<string, unknown> {
  const existing = raw ?? {};
  const assistant = existing.assistant;
  if (
    assistant &&
    typeof assistant === "object" &&
    isFlowType((assistant as { flow_type?: string }).flow_type)
  ) {
    return existing;
  }

  const flowType = inferFlowTypeFromCategorySlug(
    options.categorySlug ?? undefined,
    options.direction,
    options.isBusiness
  );
  if (!flowType) {
    return existing;
  }

  return mergeAssistantMetadata(existing, { flow_type: flowType });
}

export function flowTypeFromRuleCategory(
  categorySlug: string | undefined,
  direction: string,
  isBusiness: boolean
): FlowType | null {
  return inferFlowTypeFromCategorySlug(categorySlug, direction, isBusiness);
}
