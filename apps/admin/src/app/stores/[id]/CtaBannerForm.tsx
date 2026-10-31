'use client'

import { IconCheck } from '@tabler/icons-react'
import { useTransition, useState } from 'react'

import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { Button } from '@bitvora/ui/src/Button'
import { HeroImageUploader } from './HeroImageUploader'
import { upsertCtaBannerSection } from './action'

export function CtaBannerForm({
  storeId,
  initialHeading,
  initialImageUrl,
  initialCtaText,
}: {
  storeId: string
  initialHeading: string
  initialImageUrl: string
  initialCtaText: string
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      await upsertCtaBannerSection(storeId, formData)
      setSaved(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="cta_heading">Banner heading</Label>
        <Input id="cta_heading" name="heading" defaultValue={initialHeading} placeholder="e.g. Build your style with confidence" maxLength={100} />
      </div>
      <div>
        <Label htmlFor="cta_button_text">Button text</Label>
        <Input id="cta_button_text" name="cta_text" defaultValue={initialCtaText || 'Shop now'} maxLength={30} />
      </div>
      <div>
        <Label>Banner image</Label>
        <HeroImageUploader initialUrl={initialImageUrl} />
      </div>
      <Button type="submit" disabled={isPending} variant="secondary">
        {isPending ? 'Saving...' : saved ? <span className="inline-flex items-center gap-1">Saved <IconCheck className="w-4 h-4" /></span> : 'Save'}
      </Button>
    </form>
  )
}