import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createClient } from '../../../lib/supabase/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const FOLDER = 'bitvora-storefront/products'
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,gif,avif'

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('is_suspended')
    .eq('user_id', user.id)
    .single()

  if (!merchant || merchant.is_suspended) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret) {
    return NextResponse.json({ error: 'Uploads are not configured' }, { status: 500 })
  }

  const timestamp = Math.round(Date.now() / 1000)

  // Every param signed here must be sent with the upload request, unchanged.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: FOLDER, allowed_formats: ALLOWED_FORMATS },
    apiSecret
  )

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: FOLDER,
    allowedFormats: ALLOWED_FORMATS,
  })
}