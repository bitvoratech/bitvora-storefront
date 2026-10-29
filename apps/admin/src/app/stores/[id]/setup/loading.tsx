import { CardSkeleton, FormFieldsSkeleton, LoadingRegion } from '../../../../components/PageSkeletons'
import { Skeleton } from '../../../../components/ui/skeleton'

// Setup wizard: step labels, then the current step's card.
export default function SetupLoading() {
  return (
    <LoadingRegion className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-56 mb-2" />
      <Skeleton className="h-4 w-72 max-w-full mb-6" />
      <CardSkeleton>
        <FormFieldsSkeleton fields={3} />
        <Skeleton className="h-10 w-full rounded-lg mt-6" />
      </CardSkeleton>
    </LoadingRegion>
  )
}
