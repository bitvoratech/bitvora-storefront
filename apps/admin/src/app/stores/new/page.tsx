import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { StoreForm } from './StoreForm'
import { Card } from '@bitvora/ui/src/Card'
import Link from 'next/link'
import { IconLock } from '@tabler/icons-react'
import { Button } from '@bitvora/ui/src/Button'
import { hasActivePlan, storeLimitMessage, underStoreLimit } from '../../../lib/plans'
import { canOpenStore } from '../../../lib/merchant-identity'

export default async function NewStorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, verification_status, phone_verified_at, is_owner, is_admin, plan, subscription_status, current_period_end')
    .eq('user_id', user.id)
    .single()

  // Owner and admin accounts run the platform, not stores.
  if (merchant?.is_owner || merchant?.is_admin) redirect('/owner')

  // A store needs a verified phone (OTP on /verify). NIN/CAC is optional.
  if (!canOpenStore(merchant)) redirect('/verify')
  // Then the plan picked at signup has to be paid for.
  if (!hasActivePlan(merchant)) redirect('/billing')

  // Opened directly (the New store buttons show a popup instead): explain the
  // limit here rather than letting them fill in a form that will be refused.
  const { count: storeCount } = await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant!.id)
  if (!underStoreLimit(merchant?.plan, storeCount ?? 0)) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center py-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <IconLock className="w-5 h-5 text-indigo-600" stroke={1.75} />
          </div>
          <h1 className="text-lg font-display font-semibold mb-1.5">Upgrade to add another store</h1>
          <p className="text-sm text-ink/60 mb-5">{storeLimitMessage(merchant?.plan)}</p>
          <Link href="/billing">
            <Button>See plans &amp; upgrade</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-semibold mb-1">Create your store</h1>
      <Card>
        <StoreForm />
      </Card>
    </div>
  )
}