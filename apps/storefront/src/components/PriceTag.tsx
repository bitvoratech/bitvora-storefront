/**
 * Price with an optional "was" price. compare_at_price only counts as a
 * discount when it's actually higher than the current price.
 */
export function PriceTag({
  price,
  compareAt,
  size = 'sm',
  className = '',
}: {
  price: number | string
  compareAt?: number | string | null
  size?: 'sm' | 'lg'
  className?: string
}) {
  const now = Number(price)
  const was = compareAt != null ? Number(compareAt) : 0
  const onSale = was > now && now > 0
  const percentOff = onSale ? Math.round(((was - now) / was) * 100) : 0

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className={`font-mono font-semibold ${size === 'lg' ? 'text-2xl' : 'text-base'} text-[#171717]`}>
        ₦{now.toLocaleString()}
      </span>
      {onSale && (
        <>
          <span className={`font-mono line-through text-[#737373] ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
            <span className="sr-only">Was </span>₦{was.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 bg-red-50 rounded-full px-1.5 py-0.5">
            {percentOff}% off
          </span>
        </>
      )}
    </div>
  )
}
