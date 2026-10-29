import { ChartCardSkeleton, LoadingRegion } from '../../../components/PageSkeletons'

export default function RevenueLoading() {
  return (
    <LoadingRegion>
      <ChartCardSkeleton chartHeight="h-56 sm:h-72" />
    </LoadingRegion>
  )
}
