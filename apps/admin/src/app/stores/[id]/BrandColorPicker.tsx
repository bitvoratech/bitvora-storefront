'use client'

import { useState, useTransition } from 'react'

import { Label } from '@bitvora/ui/src/Label'
import { updateStorePalette } from './action';

const PRESETS = [
  { name: 'Ink', value: '#171717' },
  { name: 'Indigo', value: '#2A3B8F' },
  { name: 'Marigold', value: '#E8A33D' },
  { name: 'Palm', value: '#3F7D5C' },
  { name: 'Pepper', value: '#C1443B' },
  { name: 'Rose', value: '#B5495B' },
  { name: 'Ocean', value: '#1D6C8C' },
]

export function BrandColorPicker({ storeId, initialColor }: { storeId: string; initialColor: string }) {
  const [color, setColor] = useState(initialColor)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSelect(value: string) {
    setColor(value)
    setSaved(false)
    const formData = new FormData()
    formData.append('primary', value)
    startTransition(async () => {
      await updateStorePalette(storeId, formData)
      setSaved(true)
    })
  }

  return (
    <div>
      <Label>Brand color</Label>
      <p className="text-xs text-ink/50 mb-3">
        This is the accent color customers see on your storefront — buttons, highlights, and links.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handleSelect(preset.value)}
            title={preset.name}
            aria-label={preset.name}
            aria-pressed={color === preset.value}
            className={`w-9 h-9 rounded-full border-2 transition-all ${
              color === preset.value ? 'border-ink scale-110' : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: preset.value }}
          />
        ))}

        <label className="relative w-9 h-9 rounded-full border-2 border-dashed border-sand-200 flex items-center justify-center cursor-pointer overflow-hidden">
          <input
            type="color"
            value={color}
            onChange={(e) => handleSelect(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="text-xs text-ink/40">+</span>
        </label>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div className="w-5 h-5 rounded-md border border-sand-200" style={{ backgroundColor: color }} />
        <span className="text-xs font-mono text-ink/50">{color}</span>
        {isPending && <span className="text-xs text-ink/40">Saving...</span>}
        {saved && !isPending && <span className="text-xs text-palm-600">Saved</span>}
      </div>
    </div>
  )
}