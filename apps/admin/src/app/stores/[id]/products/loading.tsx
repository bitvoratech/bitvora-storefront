import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from '../../../../components/PageSkeletons'
import { Skeleton } from '../../../../components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <LoadingRegion className="max-w-5xl">
      <PageHeaderSkeleton action />
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-10 flex-1 min-w-[180px] rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <TableSkeleton rows={6} thumbnail />
    </LoadingRegion>
  )
}
