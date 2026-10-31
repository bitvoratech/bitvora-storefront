'use client'

import { IconCheck } from '@tabler/icons-react'
import { useTransition, useState } from 'react'

import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { Button } from '@bitvora/ui/src/Button'
import { HeroImageUploader } from './HeroImageUploader'
import { upsertBannerGridSection } from './action'

type Tile = { heading: string; image_url: string; cta_text: string }

export function BannerGridForm({
  storeId,
  initialTiles,
}: {
  storeId: string
  initialTiles: Tile[]
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const tiles = [0, 1, 2].map((i) => initialTiles[i] || { heading: '', image_url: '', cta_text: '' })

  function handleSubmit(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      await upsertBannerGridSection(storeId, formData)
      setSaved(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {tiles.map((tile, i) => {
        const n = i + 1
        return (
          <div key={n} className="border border-sand-200 rounded-lg p-3 space-y-2.5">
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">Tile {n}</p>
            <div>
              <Label htmlFor={`tile${n}_heading`}>Heading</Label>
              <Input id={`tile${n}_heading`} name={`tile${n}_heading`} defaultValue={tile.heading} placeholder="e.g. Fresh Drops" maxLength={60} />
            </div>
            <div>
              <Label htmlFor={`tile${n}_cta`}>Button text</Label>
              <Input id={`tile${n}_cta`} name={`tile${n}_cta`} defaultValue={tile.cta_text || 'Shop now'} maxLength={24} />
            </div>
            <div>
              <Label>Image</Label>
              <HeroImageUploader initialUrl={tile.image_url} name={`tile${n}_image`} />
            </div>
          </div>
        )
      })}
      <Button type="submit" disabled={isPending} variant="secondary">
        {isPending ? 'Saving...' : saved ? <span className="inline-flex items-center gap-1">Saved <IconCheck className="w-4 h-4" /></span> : 'Save'}
      </Button>
    </form>
  )
}