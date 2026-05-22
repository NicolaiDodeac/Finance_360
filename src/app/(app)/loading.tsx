export default function AppSegmentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-56 rounded-lg bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
