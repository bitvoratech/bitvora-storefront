import { CardSkeleton, FormFieldsSkeleton, LoadingRegion } from '../../../../components/PageSkeletons'
import { Skeleton } from '../../../../components/ui/skeleton'

// Customize: title with the publish toggle, the section tabs, then the
// editor for the open tab.
export default function CustomizeLoading() {
  return (
    <LoadingRegion className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-8 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex gap-2 overflow-hidden mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />
        ))}
      </div>
      <CardSkeleton>
        <Skeleton className="h-40 sm:h-56 w-full rounded-lg mb-5" />
        <FormFieldsSkeleton fields={3} />
        <Skeleton className="h-10 w-32 rounded-lg mt-6" />
      </CardSkeleton>
    </LoadingRegion>
  )
}
