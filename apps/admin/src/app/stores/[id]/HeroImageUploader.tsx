'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import { useState } from 'react'
import { uploadToCloudinary } from '@bitvora/lib/cloudinary-upload'
import { IconUpload } from '@tabler/icons-react'

export function HeroImageUploader({
  initialUrl,
  name = 'image_url',
}: {
  initialUrl: string
  name?: string
}) {
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadedUrl = await uploadToCloudinary(file)
      setUrl(uploadedUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="relative">
          <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
          <label className="absolute bottom-2 right-2 bg-white/90 dark:bg-sand-100/90 text-ink text-xs rounded-md px-2 py-1 cursor-pointer">
            {uploading ? 'Uploading...' : 'Change'}
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
          </label>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border border-dashed border-sand-200 rounded-lg h-32 text-sm text-ink/50 cursor-pointer hover:border-indigo-600 hover:text-indigo-600 transition-colors">
          <IconUpload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload image'}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      )}
    </div>
  )
}