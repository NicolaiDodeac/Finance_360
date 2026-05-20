import { Button } from "@/components/ui/button";
import type { PlainChoice } from "@/lib/categorization/categorise-flow";

interface ChoiceButtonsProps {
  choices: PlainChoice[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export function ChoiceButtons({
  choices,
  selectedId,
  disabled,
  onSelect,
}: ChoiceButtonsProps) {
  return (
    <div className="grid gap-2">
      {choices.map((choice) => (
        <Button
          key={choice.id}
          type="button"
          variant={selectedId === choice.id ? "default" : "outline"}
          disabled={disabled}
          className="h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left text-base font-medium"
          onClick={() => onSelect(choice.id)}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  );
}
