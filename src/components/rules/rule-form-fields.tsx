"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getCategoryOptionLabel,
  getSelectableCategories,
} from "@/lib/categories/display";
import type { CategoryRow } from "@/lib/categories/queries";
import type { CategorizationRuleFormInput } from "@/lib/categorization/types";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface RuleFormFieldsProps {
  value: CategorizationRuleFormInput;
  onChange: (value: CategorizationRuleFormInput) => void;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  disabled?: boolean;
}

export function RuleFormFields({
  value,
  onChange,
  categories,
  hmrcCategories,
  disabled,
}: RuleFormFieldsProps) {
  const patch = (partial: Partial<CategorizationRuleFormInput>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rule-name">Rule name</Label>
        <Input
          id="rule-name"
          value={value.name}
          disabled={disabled}
          placeholder="e.g. Remember: CURSOR"
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rule-match-field">Match in</Label>
          <Select
            id="rule-match-field"
            value={value.match_field}
            disabled={disabled}
            onChange={(e) =>
              patch({
                match_field: e.target.value as CategorizationRuleFormInput["match_field"],
              })
            }
          >
            <option value="both">Description & merchant</option>
            <option value="description">Description only</option>
            <option value="merchant_name">Merchant only</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-match-type">Match type</Label>
          <Select
            id="rule-match-type"
            value={value.match_type}
            disabled={disabled}
            onChange={(e) =>
              patch({
                match_type: e.target.value as CategorizationRuleFormInput["match_type"],
              })
            }
          >
            <option value="contains">Contains</option>
            <option value="equals">Equals</option>
            <option value="starts_with">Starts with</option>
            <option value="regex">Regex</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-keyword">Keyword</Label>
        <Input
          id="rule-keyword"
          value={value.keyword}
          disabled={disabled}
          placeholder="e.g. CURSOR, AI POWERED"
          onChange={(e) => patch({ keyword: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Case-insensitive. First matching rule by priority wins.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rule-category">Category</Label>
          <Select
            id="rule-category"
            value={value.category_id ?? ""}
            disabled={disabled}
            onChange={(e) =>
              patch({ category_id: e.target.value || null })
            }
          >
            <option value="">None</option>
            {getSelectableCategories(categories).map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryOptionLabel(category, categories)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-hmrc">Tax category</Label>
          <Select
            id="rule-hmrc"
            value={value.hmrc_category_id ?? ""}
            disabled={disabled}
            onChange={(e) =>
              patch({ hmrc_category_id: e.target.value || null })
            }
          >
            <option value="">None</option>
            {hmrcCategories.map((hmrc) => (
              <option key={hmrc.id} value={hmrc.id}>
                {hmrc.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rule-priority">Priority</Label>
          <Input
            id="rule-priority"
            type="number"
            value={value.priority}
            disabled={disabled}
            onChange={(e) =>
              patch({ priority: Number.parseInt(e.target.value, 10) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">Higher runs first.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-business">Business flag</Label>
          <Select
            id="rule-business"
            value={
              value.is_business === null
                ? ""
                : value.is_business
                  ? "yes"
                  : "no"
            }
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value;
              patch({
                is_business: v === "" ? null : v === "yes",
              });
            }}
          >
            <option value="">Leave unchanged</option>
            <option value="yes">Mark as business</option>
            <option value="no">Mark as personal</option>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.is_active}
          disabled={disabled}
          className="rounded border-border"
          onChange={(e) => patch({ is_active: e.target.checked })}
        />
        Active — apply this automatically next time
      </label>
    </div>
  );
}
