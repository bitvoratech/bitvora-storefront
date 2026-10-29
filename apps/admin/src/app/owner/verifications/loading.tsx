import { DetailCardSkeleton, LoadingRegion, SectionTitleSkeleton, TableSkeleton } from '../../../components/PageSkeletons'
import { Skeleton } from '../../../components/ui/skeleton'

// A queue of cards to act on, then the recently handled list.
export default function Loading() {
  return (
    <LoadingRegion className="space-y-8">
      <div>
        <Skeleton className="h-4 w-44 mb-2" />
        <Skeleton className="h-3 w-64 max-w-full mb-3" />
        <div className="grid gap-4 md:grid-cols-2">
          <DetailCardSkeleton />
          <DetailCardSkeleton />
        </div>
      </div>
      <div>
        <SectionTitleSkeleton />
        <TableSkeleton rows={4} header={false} />
      </div>
    </LoadingRegion>
  )
}
