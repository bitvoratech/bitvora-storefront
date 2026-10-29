'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import { useState } from 'react'

import { updateAvatar } from './action'
import { IconCamera, IconLoader2 } from '@tabler/icons-react'
import { uploadToCloudinary } from '@bitvora/lib/cloudinary-upload';

export function AvatarUploader({ initialUrl, initial }: { initialUrl: string; initial: string }) {
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const uploadedUrl = await uploadToCloudinary(file)
      const result = await updateAvatar(uploadedUrl)
      if (result?.error) throw new Error(result.error)
      setUrl(uploadedUrl)
    } catch {
      setError('Couldn’t upload that photo. Try another one.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="shrink-0">
      <label
        className="relative block w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-sand-100 shadow-md cursor-pointer group focus-within:ring-2 focus-within:ring-indigo-600">
        {url ? (
          <img src={url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-semibold">
            {initial}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <IconLoader2 className="w-6 h-6 text-white animate-spin" stroke={2} />
          </div>
        )}
        {/* Always visible: there's no hover on a phone to reveal it. */}
        <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-indigo-600 text-white border-2 border-white dark:border-sand-100 flex items-center justify-center shadow group-hover:bg-indigo-700 transition-colors">
          <IconCamera className="w-4 h-4" stroke={1.75} />
        </span>
        <input type="file" accept="image/*" aria-label="Change profile photo" onChange={handleFileChange} disabled={uploading} className="sr-only" />
      </label>
      {error && <p role="alert" className="text-xs text-pepper-600 mt-2 max-w-[14rem]">{error}</p>}
    </div>
  )
}
