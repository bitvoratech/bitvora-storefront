'use client'

import { IconCheck } from '@tabler/icons-react'
import { useTransition, useState } from 'react'

import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { Button } from '@bitvora/ui/src/Button'
import { upsertHeroSection } from './action'
import { HeroImageUploader } from './HeroImageUploader'


export function StoreContentForm({
  storeId,
  initialHeading,
  initialSubheading,
  initialImageUrl,
  initialCtaText,
}: {
  storeId: string
  initialHeading: string
  initialSubheading: string
  initialImageUrl: string
  initialCtaText: string
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      await upsertHeroSection(storeId, formData)
      setSaved(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="heading">Hero heading</Label>
        <Input id="heading" name="heading" defaultValue={initialHeading} placeholder="e.g. Fresh drops every Friday" maxLength={80} />
      </div>
      <div>
        <Label htmlFor="subheading">Hero subheading</Label>
        <Input id="subheading" name="subheading" defaultValue={initialSubheading} placeholder="e.g. Handmade jewelry, made in Lagos" maxLength={120} />
      </div>
      <div>
        <Label htmlFor="cta_text">Button text</Label>
        <Input id="cta_text" name="cta_text" defaultValue={initialCtaText || 'Shop now'} maxLength={30} />
      </div>
      <div>
        <Label>Hero image</Label>
        <HeroImageUploader initialUrl={initialImageUrl} />
      </div>
      <Button type="submit" disabled={isPending} variant="secondary">
        {isPending ? 'Saving...' : saved ? <span className="inline-flex items-center gap-1">Saved <IconCheck className="w-4 h-4" /></span> : 'Save'}
      </Button>
    </form>
  )
}