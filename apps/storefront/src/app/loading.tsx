import { StoreShellSkeleton } from '../components/Skeleton'

// Opening a store link cold: the store's header and layout are still
// loading, so stand in for the whole page.
export default function Loading() {
  return <StoreShellSkeleton />
}
