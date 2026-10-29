import { BackLinkSkeleton, CardSkeleton, LoadingRegion } from '../../../../../components/PageSkeletons'
import { Skeleton } from '../../../../../components/ui/skeleton'

// Order detail: customer and status, call/WhatsApp buttons, then the
// status, delivery and items cards.
export default function OrderDetailLoading() {
  return (
    <LoadingRegion>
      <BackLinkSkeleton />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 mb-6">
          <Skeleton className="h-4 w-28 mr-1" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <CardSkeleton className="mb-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
        </CardSkeleton>
        <CardSkeleton className="mb-4">
          <Skeleton className="h-4 w-36 mb-3" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardSkeleton>
        <CardSkeleton>
          <Skeleton className="h-4 w-14 mb-3" />
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <div className="border-t border-sand-200 pt-2.5 flex justify-between gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardSkeleton>
      </div>
    </LoadingRegion>
  )
}
