import { HTMLAttributes } from 'react'
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { Card } from './Card'

type Trend = 'up' | 'down' | 'flat'

interface KpiCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string
  trendLabel?: string
  trend?: Trend
}

const TREND_STYLES: Record<Trend, string> = {
  up: 'text-palm-600',
  down: 'text-pepper-600',
  flat: 'text-ink/40',
}

const TREND_ICON: Record<Trend, typeof IconTrendingUp | null> = {
  up: IconTrendingUp,
  down: IconTrendingDown,
  flat: null,
}

export function KpiCard({ label, value, trendLabel, trend = 'flat', className = '', ...props }: KpiCardProps) {
  const TrendIcon = TREND_ICON[trend]
  return (
    <Card className={`p-3.5 sm:p-4.5 ${className}`} {...props}>
      <p className="text-xs text-ink/50 font-medium mb-1.5 sm:mb-2.5">{label}</p>
      <p className="font-display text-lg sm:text-2xl font-semibold mb-1.5 truncate">{value}</p>
      {trendLabel && (
        <p className={`inline-flex items-center gap-1 text-xs font-medium ${TREND_STYLES[trend]}`}>
          {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
          {trendLabel}
        </p>
      )}
    </Card>
  )
}