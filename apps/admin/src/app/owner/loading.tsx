import { ChartCardSkeleton, KpiRowSkeleton, LoadingRegion, SectionTitleSkeleton, TableSkeleton } from '../../components/PageSkeletons'
import { Skeleton } from '../../components/ui/skeleton'

// Console overview: attention tiles, GMV with sparkline, KPIs, recent stores.
// The console title above stays put; it comes from the layout.
export default function OwnerLoading() {
  return (
    <LoadingRegion>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-sand-200 p-4">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="mb-8">
        <ChartCardSkeleton chartHeight="h-12" className="mb-3" />
        <KpiRowSkeleton />
      </div>
      <SectionTitleSkeleton />
      <TableSkeleton rows={5} header={false} />
    </LoadingRegion>
  )
}
