// The product grid sits at this position: sections the merchant orders above
// it render before the products, the rest after. Any section type can go
// either side, so reordering in the admin never makes a section disappear.
export const PRODUCTS_POSITION = 5

export function splitSections<T extends { position: number }>(sections: T[] | null | undefined) {
  const all = sections ?? []
  return {
    beforeProducts: all.filter((s) => s.position < PRODUCTS_POSITION),
    afterProducts: all.filter((s) => s.position >= PRODUCTS_POSITION),
  }
}
