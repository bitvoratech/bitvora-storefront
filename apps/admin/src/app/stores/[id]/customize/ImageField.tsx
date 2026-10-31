'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import { useState } from 'react'
import { IconUpload } from '@tabler/icons-react'
import { uploadToCloudinary } from '@bitvora/lib/cloudinary-upload';

export function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      onChange(url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full h-28 object-cover rounded-lg" />
          <label className="absolute bottom-2 right-2 bg-white/90 dark:bg-sand-100/90 text-ink text-xs rounded-md px-2 py-1 cursor-pointer">
            {uploading ? 'Uploading...' : 'Change'}
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
          </label>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border border-dashed border-sand-200 rounded-lg h-28 text-sm text-ink/50 cursor-pointer hover:border-indigo-600 hover:text-indigo-600 transition-colors">
          <IconUpload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload image'}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      )}
    </div>
  )
}