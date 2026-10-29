// Loading placeholders for the storefront, in the same spirit as shadcn's
// Skeleton. Each layout below mirrors the page it stands in for so nothing
// jumps when the real content arrives on a slow connection.

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-[#f0f0f0] ${className}`} {...props} />
}

// Announces the loading state once to screen readers.
export function LoadingRegion({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden flex flex-col">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-3 sm:p-4 pb-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Store home: hero banner, collection tiles, then the product grid with its
// heading and filter chips.
export function StoreHomeSkeleton() {
  return (
    <LoadingRegion>
      <Skeleton className="-mx-4 sm:-mx-6 mb-12 sm:mb-16 h-[380px] sm:h-[520px] rounded-none" />
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-12 sm:mb-16 flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="shrink-0 w-[78%] sm:w-auto h-[200px] sm:h-[280px] rounded-2xl" />
        ))}
      </div>
      <div className="flex flex-col items-center mb-8">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2 overflow-hidden mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
        ))}
      </div>
      <ProductGridSkeleton />
    </LoadingRegion>
  )
}

// Product page: gallery on the left (on top on mobile), details on the right.
export function ProductPageSkeleton() {
  return (
    <LoadingRegion>
      <div className="flex items-center justify-between gap-3 mb-6">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        <div>
          <Skeleton className="aspect-square rounded-xl" />
          <div className="grid grid-cols-5 gap-2 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-8 sm:h-9 w-4/5 mb-3" />
          <Skeleton className="h-7 w-32 mb-4" />
          <Skeleton className="h-7 w-24 rounded-full mb-5" />
          <div className="space-y-2 mb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </LoadingRegion>
  )
}

function SummaryBoxSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="border border-[#e5e5e5] rounded-xl p-5 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex justify-between gap-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
      <div className="border-t border-[#e5e5e5] pt-2.5 flex justify-between gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-11 w-full rounded-lg mt-2" />
    </div>
  )
}

export function CartSkeleton() {
  return (
    <LoadingRegion>
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-8 w-36 mb-6" />
      <div className="grid gap-8 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-[#e5e5e5] pb-5">
              <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <SummaryBoxSkeleton />
        </div>
      </div>
    </LoadingRegion>
  )
}

// The delivery and payment choices, which wait on the store's settings.
export function CheckoutOptionsSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Loading delivery and payment options…</span>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-52 mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <LoadingRegion>
      <Skeleton className="h-4 w-28 mb-6" />
      <Skeleton className="h-8 w-36 mb-6" />
      <div className="grid gap-8 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <CheckoutOptionsSkeleton />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div>
          <SummaryBoxSkeleton lines={2} />
        </div>
      </div>
    </LoadingRegion>
  )
}

export function OrderConfirmationSkeleton() {
  return (
    <LoadingRegion className="max-w-lg mx-auto py-10 flex flex-col items-center">
      <Skeleton className="w-14 h-14 rounded-full mb-5" />
      <Skeleton className="h-8 w-44 mb-3" />
      <Skeleton className="h-4 w-64 max-w-full mb-8" />
      <div className="w-full border border-[#e5e5e5] rounded-xl p-5 space-y-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <div className="border-t border-[#e5e5e5] pt-2.5 flex justify-between gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-9 w-56 rounded-lg mt-6" />
    </LoadingRegion>
  )
}

// First visit to a store, before its header has loaded.
export function StoreShellSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="hidden md:block h-10 flex-1 max-w-md rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="md:hidden px-4 pb-3">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <StoreHomeSkeleton />
      </div>
    </div>
  )
}
