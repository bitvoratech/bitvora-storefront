'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import { useState } from 'react'

import { Label } from '@bitvora/ui/src/Label'
import { IconUpload, IconX } from '@tabler/icons-react'
import { uploadToCloudinary } from '@bitvora/lib/cloudinary-upload'

export function ImageUploader({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file)
        uploaded.push(url)
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img !== url))
  }

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <Label>Product images</Label>

      <label className="flex items-center gap-2 border border-dashed border-sand-200 rounded-lg px-3 py-3 text-sm text-ink/50 cursor-pointer hover:border-indigo-600 hover:text-indigo-600 transition-colors">
        <IconUpload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Click to upload images'}
        <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} className="hidden" />
      </label>

      {error && <p className="text-sm text-pepper-600 mt-1.5">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {images.map((url) => (
            <div key={url} className="relative group">
              <img src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                // Always visible on touch screens, which have no hover.
                className="absolute -top-1.5 -right-1.5 bg-pepper-600 text-white rounded-full w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <IconX className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}