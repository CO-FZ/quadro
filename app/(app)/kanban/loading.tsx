export default function KanbanLoading() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-28 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-36 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-44 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>

      {/* 5 columns — matches xl:grid-cols-5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1 min-h-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border-2 border-border bg-card"
          >
            {/* Column header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            </div>
            {/* Card placeholders */}
            <div className="flex flex-col gap-3 p-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="h-28 bg-muted rounded-xl animate-pulse"
                  style={{ animationDelay: `${(i * 3 + j) * 60}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
