export default function MatrizLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-40 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-52 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Grid skeleton — header row + user rows */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Date header row */}
        <div className="flex border-b border-border bg-muted/40">
          <div className="w-40 shrink-0 px-4 py-3">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex-1 grid grid-cols-7 divide-x divide-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-2 py-3 flex flex-col items-center gap-1">
                <div className="h-3 w-6 bg-muted rounded animate-pulse" />
                <div className="h-5 w-7 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* User rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex border-b border-border last:border-0">
            {/* User cell */}
            <div className="w-40 shrink-0 px-4 py-3 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
            {/* Day cells */}
            <div className="flex-1 grid grid-cols-7 divide-x divide-border">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="px-1 py-2 min-h-[56px] flex flex-col gap-1">
                  {j % 3 === 0 && (
                    <div
                      className="h-5 bg-muted rounded animate-pulse"
                      style={{ animationDelay: `${(i * 7 + j) * 40}ms` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
