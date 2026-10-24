import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
  // The size the shopper picked, for products the merchant gave sizes to.
  // The same product in two sizes is two cart lines.
  size?: string
  // Stock when the item was added. Older carts don't have it; the
  // create_order RPC still enforces live stock either way.
  maxQuantity?: number
}

/** Most of this item a shopper can put in the cart. */
export function lineLimit(item: Pick<CartItem, 'maxQuantity'>) {
  return Math.max(1, Math.min(item.maxQuantity ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY))
}

function sameLine(item: Pick<CartItem, 'productId' | 'size'>, productId: string, size?: string) {
  return item.productId === productId && (item.size ?? '') === (size ?? '')
}

// Matches the per-line cap enforced by the create_order RPC.
export const MAX_ITEM_QUANTITY = 999

// Carts are kept per store slug: every store shares this origin (and so this
// localStorage key), and an order can only contain one store's products.
type CartState = {
  carts: Record<string, CartItem[]>
  addItem: (slug: string, item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (slug: string, productId: string, size?: string) => void
  updateQuantity: (slug: string, productId: string, size: string | undefined, quantity: number) => void
  clear: (slug: string) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      addItem: (slug, item, quantity = 1) =>
        set((state) => {
          const items = state.carts[slug] ?? []
          const existing = items.find((i) => sameLine(i, item.productId, item.size))
          const next = existing
            ? items.map((i) => {
                if (!sameLine(i, item.productId, item.size)) return i
                const merged = { ...i, maxQuantity: item.maxQuantity ?? i.maxQuantity }
                return { ...merged, quantity: Math.min(i.quantity + quantity, lineLimit(merged)) }
              })
            : [...items, { ...item, quantity: Math.min(quantity, lineLimit(item)) }]
          return { carts: { ...state.carts, [slug]: next } }
        }),
      removeItem: (slug, productId, size) =>
        set((state) => ({
          carts: {
            ...state.carts,
            [slug]: (state.carts[slug] ?? []).filter((i) => !sameLine(i, productId, size)),
          },
        })),
      updateQuantity: (slug, productId, size, quantity) =>
        set((state) => {
          const items = state.carts[slug] ?? []
          const next = quantity <= 0
            ? items.filter((i) => !sameLine(i, productId, size))
            : items.map((i) =>
                sameLine(i, productId, size) ? { ...i, quantity: Math.min(quantity, lineLimit(i)) } : i
              )
          return { carts: { ...state.carts, [slug]: next } }
        }),
      clear: (slug) =>
        set((state) => {
          const carts = { ...state.carts }
          delete carts[slug]
          return { carts }
        }),
    }),
    {
      name: 'bitvora-storefront-cart',
      version: 1,
      // v0 was a single cart shared by every store; we can't tell which store
      // its items belonged to, so start fresh rather than mix stores.
      migrate: () => ({ carts: {} }),
    }
  )
)

const EMPTY: CartItem[] = []

/** Stable key for a cart line: product plus size. */
export function lineKey(item: Pick<CartItem, 'productId' | 'size'>) {
  return item.size ? `${item.productId}:${item.size}` : item.productId
}

/** The cart for one store. */
export function useCart(slug: string) {
  const items = useCartStore((s) => s.carts[slug] ?? EMPTY)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clear = useCartStore((s) => s.clear)

  return {
    items,
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => addItem(slug, item, quantity),
    removeItem: (productId: string, size?: string) => removeItem(slug, productId, size),
    updateQuantity: (productId: string, size: string | undefined, quantity: number) =>
      updateQuantity(slug, productId, size, quantity),
    clear: () => clear(slug),
  }
}
