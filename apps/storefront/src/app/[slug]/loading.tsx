// Shown inside the store layout (header stays put) while a store page loads.
export default function StoreLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mx-auto mb-10 h-7 w-48 rounded-md bg-[#f2f2f2] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#ececec] overflow-hidden">
            <div className="aspect-square bg-[#f2f2f2] animate-pulse" />
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[#f2f2f2] animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-[#f2f2f2] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
