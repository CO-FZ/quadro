export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-6 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <div className="h-7 w-10 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-3">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
