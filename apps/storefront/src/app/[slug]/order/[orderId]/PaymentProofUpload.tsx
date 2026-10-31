'use client'

import { useState } from 'react'

import { savePaymentProof } from './actions'
import { IconCheck, IconUpload } from '@tabler/icons-react'
import { uploadToCloudinary } from '@bitvora/lib/cloudinary-upload'

export function PaymentProofUpload({
  orderId,
  slug,
  existingProofUrl,
}: {
  orderId: string
  slug: string
  existingProofUrl: string | null
}) {
  const [uploading, setUploading] = useState(false)
  const [proofUrl, setProofUrl] = useState(existingProofUrl)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadToCloudinary(file)
      const result = await savePaymentProof(orderId, slug, url)
      if (result?.error) {
        setError(result.error)
      } else {
        setProofUrl(url)
      }
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  if (proofUrl) {
    return (
      <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2.5">
        <IconCheck className="w-4 h-4 shrink-0" />
        Payment proof uploaded
      </div>
    )
  }

  return (
    <div>
      <label className="flex items-center justify-center gap-2 border border-dashed border-[#e5e5e5] rounded-lg px-3 py-3.5 text-sm text-[#737373] cursor-pointer hover:border-[#171717] hover:text-[#171717] transition-colors">
        <IconUpload className="w-4 h-4" stroke={1.75} />
        {uploading ? 'Uploading...' : 'Upload payment proof'}
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
      </label>
      {error && <p className="text-sm text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}