export default function HistoricoLoading() {
  return (
    <div className="flex flex-col gap-6 h-full w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-7 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded-md animate-pulse" />
        </div>
        
        {/* Search Input Skeleton */}
        <div className="h-10 w-full sm:w-80 bg-muted rounded-xl animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4 text-left"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></th>
                <th className="px-6 py-4 text-left"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></th>
                <th className="px-6 py-4 text-left"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></th>
                <th className="px-6 py-4 text-left"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></th>
                <th className="px-6 py-4 text-left"><div className="h-4 w-28 bg-muted rounded animate-pulse" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-6 py-4"><div className="h-5 w-48 bg-muted rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-20 bg-muted rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-24 bg-muted/80 rounded-full animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-28 bg-muted rounded animate-pulse" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Skeleton (Bottom Centered) */}
      <div className="flex justify-center mt-4">
        <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
