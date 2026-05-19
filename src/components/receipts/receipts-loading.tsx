export function ReceiptsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
