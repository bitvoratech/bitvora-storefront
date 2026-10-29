import { cn } from '@/lib/utils'
import { Skeleton } from './ui/skeleton'

// Building blocks for the dashboard's loading.tsx files. Each one mirrors
// the spacing of the real component it stands in for, so the page doesn't
// jump when the data arrives.

// Wraps a loading screen so screen readers announce it once.
export function LoadingRegion({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  )
}

// Same outline as @bitvora/ui Card.
export function CardSkeleton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('rounded-[var(--radius-card)] border border-sand-200 p-5', className)}>{children}</div>
}

export function PageHeaderSkeleton({ action = false, subtitle = true, className }: { action?: boolean; subtitle?: boolean; className?: string }) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 sm:h-8 w-44 sm:w-56" />
        {action && <Skeleton className="h-9 w-28 rounded-lg" />}
      </div>
      {subtitle && <Skeleton className="h-4 w-36 mt-2" />}
    </div>
  )
}

export function BackLinkSkeleton() {
  return <Skeleton className="h-4 w-28 mb-4" />
}

export function KpiSkeleton({ className }: { className?: string }) {
  return (
    <CardSkeleton className={cn('p-3.5 sm:p-4.5', className)}>
      <Skeleton className="h-3 w-20 mb-2.5" />
      <Skeleton className="h-6 sm:h-7 w-24" />
    </CardSkeleton>
  )
}

export function KpiRowSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  )
}

// A headline number with a chart under it (revenue, GMV).
export function ChartCardSkeleton({ chartHeight = 'h-40 sm:h-48', className }: { chartHeight?: string; className?: string }) {
  return (
    <CardSkeleton className={className}>
      <Skeleton className="h-3 w-28 mb-2" />
      <Skeleton className="h-8 w-40 mb-4" />
      <Skeleton className={cn('w-full rounded-lg', chartHeight)} />
    </CardSkeleton>
  )
}

export function SearchBarSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-full max-w-xs rounded-lg mb-4', className)} />
}

export function FilterChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-16 rounded-full" />
      ))}
    </div>
  )
}

// The tables in the dashboard are a header strip on desktop and a stack of
// rows on every screen size; this matches both.
export function TableSkeleton({
  rows = 6,
  thumbnail = false,
  header = true,
  className,
}: {
  rows?: number
  thumbnail?: boolean
  header?: boolean
  className?: string
}) {
  return (
    <div className={cn('rounded-[var(--radius-card)] border border-sand-200 overflow-hidden', className)}>
      {header && (
        <div className="hidden sm:flex gap-4 px-4 py-3 bg-sand-100">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20 ml-auto" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('flex items-center gap-3 px-4 py-3', i !== rows - 1 && 'border-b border-sand-200')}>
          {thumbnail && <Skeleton className="w-10 h-10 rounded-lg shrink-0" />}
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/5 max-w-48" />
            <Skeleton className="h-3 w-1/4 max-w-28" />
          </div>
          <Skeleton className="hidden sm:block h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function SectionTitleSkeleton() {
  return <Skeleton className="h-4 w-32 mb-3" />
}

// Label + input pairs, for the settings and product forms.
export function FormFieldsSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// The review/transfer cards on the owner console: a name, then a 2x2 grid of details.
export function DetailCardSkeleton() {
  return (
    <CardSkeleton>
      <Skeleton className="h-4 w-36 mb-1.5" />
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </CardSkeleton>
  )
}

// Full-screen auth pages (login, signup, verify…): brand panel on desktop,
// a centred form on every screen.
export function AuthPageSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <LoadingRegion className="min-h-screen flex">
      <div className="hidden lg:block lg:w-[45%]" style={{ backgroundColor: 'var(--color-indigo-900)' }} />
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm">
          <Skeleton className="h-8 w-8 rounded-lg mb-6 lg:hidden" />
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <FormFieldsSkeleton fields={fields} />
          <Skeleton className="h-10 w-full rounded-lg mt-6" />
        </div>
      </div>
    </LoadingRegion>
  )
}
