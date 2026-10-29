import { LoadingRegion, SearchBarSkeleton, TableSkeleton } from '../../../components/PageSkeletons'

export default function Loading() {
  return (
    <LoadingRegion>
      <SearchBarSkeleton />
      <TableSkeleton rows={8} />
    </LoadingRegion>
  )
}
