import { CardSkeleton, FormFieldsSkeleton, LoadingRegion, PageHeaderSkeleton } from '../../../../components/PageSkeletons'
import { Skeleton } from '../../../../components/ui/skeleton'

// Delivery & payments: delivery settings with the area list, then bank details.
export default function DeliveryLoading() {
  return (
    <LoadingRegion className="max-w-3xl">
      <PageHeaderSkeleton />
      <CardSkeleton>
        <Skeleton className="h-4 w-32 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-9 w-32 rounded-lg mt-3 mb-6" />
        <FormFieldsSkeleton fields={2} />
      </CardSkeleton>
      <CardSkeleton className="mt-6">
        <Skeleton className="h-4 w-28 mb-4" />
        <FormFieldsSkeleton fields={3} />
      </CardSkeleton>
    </LoadingRegion>
  )
}
