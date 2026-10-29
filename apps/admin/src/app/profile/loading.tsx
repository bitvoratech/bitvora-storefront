import { CardSkeleton, FormFieldsSkeleton, LoadingRegion } from '../../components/PageSkeletons'
import { Skeleton } from '../../components/ui/skeleton'

// Profile: cover band with avatar and stats, account form, password form.
export default function ProfileLoading() {
  return (
    <LoadingRegion className="max-w-5xl">
      <Skeleton className="h-8 w-28 mb-6" />
      <CardSkeleton className="p-0 overflow-hidden mb-4">
        <Skeleton className="h-24 w-full rounded-none" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3">
            <Skeleton className="w-20 h-20 rounded-full ring-4 ring-paper" />
          </div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-sand-200">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardSkeleton>
      <CardSkeleton>
        <Skeleton className="h-4 w-36 mb-4" />
        <FormFieldsSkeleton fields={3} />
      </CardSkeleton>
      <CardSkeleton className="mt-4">
        <Skeleton className="h-4 w-20 mb-4" />
        <FormFieldsSkeleton fields={2} />
      </CardSkeleton>
    </LoadingRegion>
  )
}
