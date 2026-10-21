'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import { useState } from 'react'

import { updateAvatar } from './action'
import { User } from 'switch-icons'
import { uploadToCloudinary } from '@bitvora/lib/cloudinary-upload';

export function AvatarUploader({ initialUrl, initial }: { initialUrl: string; initial: string }) {
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadedUrl = await uploadToCloudinary(file)
      setUrl(uploadedUrl)
      await updateAvatar(uploadedUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="relative block w-20 h-20 rounded-full border-4 border-white shadow-md cursor-pointer group">
      {url ? (
        <img src={url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-semibold">
          {initial}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <User className="w-5 h-5 text-white" />
      </div>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
    </label>
  )
}