import { BackLinkSkeleton, CardSkeleton, ChartCardSkeleton, LoadingRegion, SectionTitleSkeleton, TableSkeleton } from '../../../../components/PageSkeletons'
import { Skeleton } from '../../../../components/ui/skeleton'

// Merchant detail: profile card on the left, revenue, stores and orders on the right.
export default function MerchantLoading() {
  return (
    <LoadingRegion>
      <BackLinkSkeleton />
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <CardSkeleton>
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-16 rounded-full mb-3" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="w-full space-y-3 border-t border-sand-200 pt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full rounded-lg mt-5" />
          </div>
        </CardSkeleton>
        <div className="space-y-6">
          <ChartCardSkeleton chartHeight="h-12" />
          <div>
            <SectionTitleSkeleton />
            <TableSkeleton rows={2} header={false} />
          </div>
          <div>
            <SectionTitleSkeleton />
            <TableSkeleton rows={5} header={false} />
          </div>
        </div>
      </div>
    </LoadingRegion>
  )
}
