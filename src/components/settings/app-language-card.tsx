"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAppLanguage } from "@/components/providers/app-language-provider";
import {
  APP_LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/app-language";

export function AppLanguageCard() {
  const { language, setLanguage } = useAppLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>App language</CardTitle>
        <CardDescription>
          Sets the app display language. Voice input always uses English (UK).
          More translations coming later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="app-language">Language</Label>
          <Select
            id="app-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as AppLanguage)}
          >
            {(Object.keys(APP_LANGUAGE_LABELS) as AppLanguage[]).map((code) => (
              <option key={code} value={code}>
                {APP_LANGUAGE_LABELS[code]}
              </option>
            ))}
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
