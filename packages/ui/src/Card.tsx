import { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  // A padding class passed in (e.g. p-0 for edge-to-edge lists) replaces the
  // default; both in one class list would leave p-5 winning on CSS order.
  const padding = /(^|\s)p-\S+/.test(className) ? '' : 'p-5'
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-sand-200 ${padding} ${className}`}
      {...props}
    />
  )
}