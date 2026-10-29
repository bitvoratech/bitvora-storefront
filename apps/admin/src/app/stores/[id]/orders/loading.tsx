import { FilterChipsSkeleton, LoadingRegion, PageHeaderSkeleton, SearchBarSkeleton, TableSkeleton } from '../../../../components/PageSkeletons'

export default function OrdersLoading() {
  return (
    <LoadingRegion className="max-w-5xl">
      <PageHeaderSkeleton />
      <SearchBarSkeleton className="mb-3" />
      <FilterChipsSkeleton />
      <TableSkeleton rows={8} />
    </LoadingRegion>
  )
}
