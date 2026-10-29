'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'

export async function updateProfile(formData: FormData): Promise<{ error?: string; saved?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const businessName = formData.get('business_name') as string

  const { error } = await supabase
    .from('merchants')
    .update({ full_name: fullName, phone, business_name: businessName })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  revalidatePath('/')
  return { saved: true }
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('merchants').update({ avatar_url: avatarUrl }).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/profile')
}