import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlaceholderCardProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

/** Reusable empty-state card for pages awaiting future features. */
export function PlaceholderCard({
  title,
  description,
  className,
  children,
}: PlaceholderCardProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
