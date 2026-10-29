import { CardSkeleton, LoadingRegion, PageHeaderSkeleton } from '../../components/PageSkeletons'
import { Skeleton } from '../../components/ui/skeleton'

// Plan & billing: current plan with usage meters, then the upgrade card.
export default function BillingLoading() {
  return (
    <LoadingRegion className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        <CardSkeleton>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="border-t border-sand-200 mt-4 pt-4 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-14" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardSkeleton>
        <CardSkeleton>
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-4 w-full max-w-md mb-4" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg mt-4" />
        </CardSkeleton>
      </div>
    </LoadingRegion>
  )
}
