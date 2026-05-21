export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-36 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-56 bg-muted rounded animate-pulse" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted rounded-t-lg animate-pulse" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 px-5 py-3 bg-muted/40 border-b border-border">
          {[140, 80, 100, 80].map((w, i) => (
            <div key={i} className="bg-muted rounded animate-pulse" style={{ height: 14, width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0">
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-52 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-muted rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
