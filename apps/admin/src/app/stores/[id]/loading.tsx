import { CardSkeleton, KpiRowSkeleton, LoadingRegion, TableSkeleton } from '../../../components/PageSkeletons'
import { Skeleton } from '../../../components/ui/skeleton'

// Store overview: name and actions, setup progress, revenue chart, KPIs,
// then recent orders beside top products.
export default function StoreOverviewLoading() {
  return (
    <LoadingRegion className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <CardSkeleton className="mb-6">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-2 w-full rounded-full" />
      </CardSkeleton>

      <div className="mb-8">
        <div className="p-5 mb-3">
          <Skeleton className="h-3 w-28 mb-2" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-48 sm:h-56 w-full rounded-[var(--radius-card)]" />
        <KpiRowSkeleton className="mt-3" />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <TableSkeleton rows={5} header={false} />
        </div>
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <TableSkeleton rows={4} header={false} thumbnail />
        </div>
      </div>
    </LoadingRegion>
  )
}
