import { BackLinkSkeleton, CardSkeleton, FormFieldsSkeleton, LoadingRegion } from '../../../../../../components/PageSkeletons'
import { Skeleton } from '../../../../../../components/ui/skeleton'

// Product form: image picker, then name, price, stock and description.
export default function ProductFormLoading() {
  return (
    <LoadingRegion className='max-w-md'>
      <BackLinkSkeleton />
      <Skeleton className='h-8 w-40 mb-6' />
      <CardSkeleton>
        <Skeleton className='h-4 w-20 mb-2' />
        <div className='flex gap-2 mb-5'>
          <Skeleton className='h-20 w-20 rounded-lg' />
          <Skeleton className='h-20 w-20 rounded-lg' />
        </div>
        <FormFieldsSkeleton fields={4} />
        <Skeleton className='h-24 w-full rounded-lg mt-5' />
        <Skeleton className='h-10 w-full rounded-lg mt-6' />
      </CardSkeleton>
    </LoadingRegion>
  )
}
