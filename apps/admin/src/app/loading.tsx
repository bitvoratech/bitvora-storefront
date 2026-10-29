import { CardSkeleton, KpiRowSkeleton, LoadingRegion, PageHeaderSkeleton } from '../components/PageSkeletons'
import { Skeleton } from '../components/ui/skeleton'

// Dashboard home (and the fallback for any page without its own): greeting,
// store KPIs, then the stores grid.
export default function Loading() {
  return (
    <LoadingRegion className="w-full">
      <PageHeaderSkeleton action subtitle={false} className="mb-8" />
      <KpiRowSkeleton className="mb-6" />
      <Skeleton className="h-10 w-full max-w-xs rounded-lg mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-sand-200">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardSkeleton>
        ))}
      </div>
    </LoadingRegion>
  )
}
