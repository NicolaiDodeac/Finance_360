export function TaxHubLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="h-10 w-48 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  );
}
