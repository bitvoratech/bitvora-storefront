// Shown inside the dashboard shell while any admin page loads.
export default function Loading() {
  return (
    <div className="w-full max-w-5xl" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-md bg-sand-100 animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-card)] border border-sand-200 bg-sand-100 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-[var(--radius-card)] border border-sand-200 bg-sand-100 animate-pulse" />
    </div>
  )
}
