const MAX_BYTES = 10 * 1024 * 1024 // 10 MB, client-side convenience check

export async function uploadToCloudinary(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 10 MB)')
  }

  const sigRes = await fetch('/api/cloudinary-signature', { method: 'POST' })
  if (!sigRes.ok) {
    throw new Error('Could not authorize upload')
  }
  const { signature, timestamp, cloudName, apiKey, folder, allowedFormats } = await sigRes.json()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('signature', signature)
  formData.append('timestamp', String(timestamp))
  formData.append('api_key', apiKey)
  formData.append('folder', folder)
  formData.append('allowed_formats', allowedFormats)

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!uploadRes.ok) throw new Error('Image upload failed')
  const data = await uploadRes.json()
  return data.secure_url as string
}
