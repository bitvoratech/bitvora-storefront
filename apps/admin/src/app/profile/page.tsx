import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { AvatarUploader } from './AvatarUploader'
import { PasswordForm } from './PasswordForm'
import { Card } from '@bitvora/ui/src/Card'
import { PackageBox, Receipt, Calendar } from 'switch-icons'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, full_name, phone, business_name, avatar_url, created_at')
    .eq('user_id', user.id)
    .single()

  const { count: storeCount } = merchant
    ? await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id)
    : { count: 0 }

  const { data: merchantStores } = merchant
    ? await supabase.from('stores').select('id').eq('merchant_id', merchant.id)
    : { data: [] }

  const storeIds = (merchantStores || []).map((s) => s.id)
  const { count: orderCount } = storeIds.length
    ? await supabase.from('orders').select('id', { count: 'exact', head: true }).in('store_id', storeIds)
    : { count: 0 }

  const memberSince = merchant?.created_at
    ? new Date(merchant.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

  const initial = merchant?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-display font-semibold mb-6">Profile</h1>

      <Card className="p-0 overflow-hidden mb-4">
        <div
          className="h-24 relative"
          style={{ backgroundColor: 'var(--color-indigo-900)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3">
            <AvatarUploader initialUrl={merchant?.avatar_url || ''} initial={initial} />
          </div>
          <p className="font-display font-semibold text-lg">{merchant?.full_name || 'Your name'}</p>
          <p className="text-sm text-ink/50">{merchant?.business_name || user.email}</p>

          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-sand-200">
            <div className="flex items-center gap-2">
              <PackageBox className="w-4 h-4 text-indigo-600" />
              <span className="text-sm"><b className="font-mono">{storeCount ?? 0}</b> <span className="text-ink/50">stores</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span className="text-sm"><b className="font-mono">{orderCount ?? 0}</b> <span className="text-ink/50">orders</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-ink/50">Since {memberSince}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-medium mb-4">Account information</p>
        <ProfileForm
          email={user.email || ''}
          initialFullName={merchant?.full_name || ''}
          initialPhone={merchant?.phone || ''}
          initialBusinessName={merchant?.business_name || ''}
        />
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-medium mb-4">Password</p>
        <PasswordForm />
      </Card>
    </div>
  )
}
