import { AuthLayout } from '../../components/AuthLayout'
import { AuthLogoutLink } from '../../components/AuthLogoutLink'

export default function SuspendedPage() {
  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-semibold mb-1">Account suspended</h1>
      <p className="text-sm text-ink/50 mb-6">
        Your account has been suspended. If you believe this is a mistake, email{' '}
        <a href="mailto:help@bitvoratech.com" className="text-indigo-600 font-medium">help@bitvoratech.com</a>.
      </p>
      <AuthLogoutLink />
    </AuthLayout>
  )
}
