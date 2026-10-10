import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getClientIp, rateLimit } from '../../../lib/rate-limit'
import { PAYMENT_PROOF_FOLDER } from '../../../lib/cloudinary-url'

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif,heic'

export async function POST() {
  const rl = await rateLimit('cloudinary-sig', await getClientIp(), 10, '1 m')
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json({ error: 'Uploads are not configured' }, { status: 500 })
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: apiSecret,
  })

  const timestamp = Math.round(Date.now() / 1000)

  // This endpoint is public (customers aren't logged in), so the signature is
  // locked to one folder and to image formats only. Every param signed here
  // must be sent with the upload request, unchanged.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: PAYMENT_PROOF_FOLDER, allowed_formats: ALLOWED_FORMATS },
    apiSecret
  )

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: PAYMENT_PROOF_FOLDER,
    allowedFormats: ALLOWED_FORMATS,
  })
}
