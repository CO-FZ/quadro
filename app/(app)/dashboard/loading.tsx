export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>

      {/* 5 status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-12 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Sector cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-muted rounded-full animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* User ranking table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
