'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { IconShoppingBag } from '@tabler/icons-react'
import { useCart } from '../lib/cart-store'

export function CartIcon({ slug }: { slug: string }) {
  const { items } = useCart(slug)
  // The cart lives in localStorage, so render 0 on the server and first paint.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0

  return (
    <Link href={`/${slug}/cart`} className="relative p-2 -mr-2">
      <IconShoppingBag className="w-5 h-5" stroke={1.75} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}