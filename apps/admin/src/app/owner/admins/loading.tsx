import { CardSkeleton, FormFieldsSkeleton, LoadingRegion, SectionTitleSkeleton, TableSkeleton } from '../../../components/PageSkeletons'
import { Skeleton } from '../../../components/ui/skeleton'

export default function AdminsLoading() {
  return (
    <LoadingRegion className="space-y-8">
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-3 w-64 max-w-full mb-3" />
        <CardSkeleton>
          <FormFieldsSkeleton fields={1} />
          <Skeleton className="h-10 w-28 rounded-lg mt-4" />
        </CardSkeleton>
      </div>
      <div>
        <SectionTitleSkeleton />
        <TableSkeleton rows={3} header={false} />
      </div>
    </LoadingRegion>
  )
}
