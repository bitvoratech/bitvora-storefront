import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
  // Stock when the item was added. Older carts don't have it; the
  // create_order RPC still enforces live stock either way.
  maxQuantity?: number
}

/** Most of this item a shopper can put in the cart. */
export function lineLimit(item: Pick<CartItem, 'maxQuantity'>) {
  return Math.max(1, Math.min(item.maxQuantity ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY))
}

// Matches the per-line cap enforced by the create_order RPC.
export const MAX_ITEM_QUANTITY = 999

// Carts are kept per store slug: every store shares this origin (and so this
// localStorage key), and an order can only contain one store's products.
type CartState = {
  carts: Record<string, CartItem[]>
  addItem: (slug: string, item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (slug: string, productId: string) => void
  updateQuantity: (slug: string, productId: string, quantity: number) => void
  clear: (slug: string) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      addItem: (slug, item, quantity = 1) =>
        set((state) => {
          const items = state.carts[slug] ?? []
          const existing = items.find((i) => i.productId === item.productId)
          const next = existing
            ? items.map((i) => {
                if (i.productId !== item.productId) return i
                const merged = { ...i, maxQuantity: item.maxQuantity ?? i.maxQuantity }
                return { ...merged, quantity: Math.min(i.quantity + quantity, lineLimit(merged)) }
              })
            : [...items, { ...item, quantity: Math.min(quantity, lineLimit(item)) }]
          return { carts: { ...state.carts, [slug]: next } }
        }),
      removeItem: (slug, productId) =>
        set((state) => ({
          carts: {
            ...state.carts,
            [slug]: (state.carts[slug] ?? []).filter((i) => i.productId !== productId),
          },
        })),
      updateQuantity: (slug, productId, quantity) =>
        set((state) => {
          const items = state.carts[slug] ?? []
          const next = quantity <= 0
            ? items.filter((i) => i.productId !== productId)
            : items.map((i) =>
                i.productId === productId ? { ...i, quantity: Math.min(quantity, lineLimit(i)) } : i
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
    removeItem: (productId: string) => removeItem(slug, productId),
    updateQuantity: (productId: string, quantity: number) => updateQuantity(slug, productId, quantity),
    clear: () => clear(slug),
  }
}
