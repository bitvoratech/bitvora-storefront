'use client'

import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Tells the MotionSafety fallback that JS is running, so it stays out of
  // the way of the real animations.
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', '')
  }, [])

  // Honour the phone's "reduce motion" setting.
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
