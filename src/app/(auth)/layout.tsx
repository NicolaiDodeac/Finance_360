import { redirectIfAuthenticated } from "@/lib/auth/helpers";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          F
        </span>
        <p className="mt-2 text-sm font-medium text-muted-foreground">Finance 360</p>
      </div>
      {children}
    </div>
  );
}
