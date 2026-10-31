'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BrandColorPicker } from '../BrandColorPicker'
import { Button } from '@bitvora/ui/src/Button'
import { IconBuildingStore, IconCheck, IconThumbUpFilled } from '@tabler/icons-react'

export function SetupWizard({
  storeId,
  storeName,
  initialColor,
}: {
  storeId: string
  storeName: string
  initialColor: string
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const router = useRouter()

  return (
    <div className="max-w-md mx-auto mt-10">
      <ol className="grid grid-cols-2 gap-2 mb-8" aria-label="Setup steps">
        {['Brand color', 'First product'].map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${step >= i + 1 ? 'bg-indigo-600' : 'bg-sand-200'}`} />
            <p className={`text-xs mt-1.5 ${step === i + 1 ? 'text-ink font-medium' : 'text-ink/40'}`}>
              <span className="sr-only">Step {i + 1}: </span>{label}
            </p>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
            <IconBuildingStore className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-1 flex items-center gap-2">
            {storeName} is ready
            <IconThumbUpFilled className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
          </h1>
          <p className="text-ink/50 text-sm mb-6">
            Pick a brand color — this is what customers see on your storefront.
          </p>
          <BrandColorPicker storeId={storeId} initialColor={initialColor} />
          <Button className="w-full mt-6" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
            <IconCheck className="w-6 h-6 text-palm-600" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-1">Almost there</h1>
          <p className="text-ink/50 text-sm mb-6">
            Add your first product now, or come back to it later — you can always add more.
          </p>
          <div className="space-y-2.5">
            <Link href={`/stores/${storeId}/products/new`}>
              <Button className="w-full">Add your first product</Button>
            </Link>
            <Button variant="secondary" className="w-full" onClick={() => router.push(`/stores/${storeId}`)}>
              I&apos;ll do this later
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}