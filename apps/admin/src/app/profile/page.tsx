import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProfileForm } from './ProfileForm'
import { AvatarUploader } from './AvatarUploader'
import { PasswordForm } from './PasswordForm'
import { Card } from '@bitvora/ui/src/Card'
import { IconCalendar, IconLock, IconPackage, IconReceipt, IconUserCircle } from '@tabler/icons-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, full_name, phone, business_name, avatar_url, created_at')
    .eq('user_id', user.id)
    .single()

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

  const stats = [
    { icon: IconPackage, value: storeIds.length, label: storeIds.length === 1 ? 'Store' : 'Stores', href: '/' },
    { icon: IconReceipt, value: orderCount ?? 0, label: orderCount === 1 ? 'Order' : 'Orders', href: null },
    { icon: IconCalendar, value: memberSince, label: 'Joined', href: null },
  ]

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-display font-semibold mb-4 sm:mb-6">Profile</h1>

      <Card className="p-0 overflow-hidden mb-4">
        <div
          className="h-20 sm:h-28 relative"
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
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12">
            <AvatarUploader initialUrl={merchant?.avatar_url || ''} initial={initial} />
            <div className="min-w-0 sm:pb-1">
              <p className="font-display font-semibold text-lg sm:text-xl truncate">{merchant?.full_name || 'Your name'}</p>
              <p className="text-sm text-ink/50 truncate">
                {merchant?.business_name ? `${merchant.business_name} · ` : ''}{user.email}
              </p>
            </div>
          </div>

          {/* Three equal tiles: they fit side by side even on a small phone. */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
            {stats.map(({ icon: Icon, value, label, href }) => {
              const body = (
                <>
                  <Icon className="w-4 h-4 text-indigo-600 mb-1.5" />
                  <p className={`font-semibold text-sm sm:text-base truncate ${typeof value === 'number' ? 'font-mono' : ''}`}>{value}</p>
                  <p className="text-[11px] sm:text-xs text-ink/50 truncate">{label}</p>
                </>
              )
              const tile = 'rounded-xl bg-sand-100 px-3 py-2.5 sm:px-4 sm:py-3 min-w-0'
              return href ? (
                <Link key={label} href={href} className={`${tile} hover:bg-sand-200 transition-colors`}>{body}</Link>
              ) : (
                <div key={label} className={tile}>{body}</div>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <IconUserCircle className="w-4 h-4 text-ink/40" stroke={1.75} />
            <p className="text-sm font-medium">Account information</p>
          </div>
          <p className="text-xs text-ink/50 mb-4">Your name and phone number are how we reach you about your stores.</p>
          <ProfileForm
            email={user.email || ''}
            initialFullName={merchant?.full_name || ''}
            initialPhone={merchant?.phone || ''}
            initialBusinessName={merchant?.business_name || ''}
          />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-1">
            <IconLock className="w-4 h-4 text-ink/40" stroke={1.75} />
            <p className="text-sm font-medium">Password</p>
          </div>
          <p className="text-xs text-ink/50 mb-4">Use at least 8 characters.</p>
          <PasswordForm />
        </Card>
      </div>
    </div>
  )
}
