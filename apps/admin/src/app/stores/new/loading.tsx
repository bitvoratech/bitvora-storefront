import { CardSkeleton, FormFieldsSkeleton, LoadingRegion } from '../../../components/PageSkeletons'
import { Skeleton } from '../../../components/ui/skeleton'

export default function NewStoreLoading() {
  return (
    <LoadingRegion className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-52 mb-3" />
      <CardSkeleton>
        <FormFieldsSkeleton fields={3} />
        <Skeleton className="h-10 w-full rounded-lg mt-6" />
      </CardSkeleton>
    </LoadingRegion>
  )
}
