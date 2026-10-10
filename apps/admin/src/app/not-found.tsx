import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="text-xl font-display font-semibold mb-2">Page not found</h1>
      <p className="text-sm text-ink/50 mb-6">
        This page doesn&apos;t exist, or it belongs to a store you don&apos;t have access to.
      </p>
      <Link href="/" className="text-sm font-medium text-indigo-600">
        Back to dashboard →
      </Link>
    </div>
  )
}
