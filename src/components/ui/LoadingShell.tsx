// src/components/ui/LoadingShell.tsx
// Skeleton placeholder while data loads.
// Use as a drop-in replacement while useMacroData() is loading.
export function LoadingShell({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card">
          <div className="h-4 bg-navy-border rounded w-1/3 mb-3" />
          <div className="h-3 bg-navy-border rounded w-1/2 mb-6" />
          <div className="h-40 bg-navy-border rounded" />
        </div>
      ))}
    </div>
  );
}