// Server-only. Never import this from a client component.
// Requires QOREID_CLIENT_ID and QOREID_SECRET_KEY in the environment.
// QoreID checks NINs against the National Identity Database. CAC numbers are
// entered manually and not checked (see submitIdentityVerification).

const QOREID_BASE_URL = 'https://api.qoreid.com'

function assertServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('identity-verification.ts must only be called from server code')
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const clientId = process.env.QOREID_CLIENT_ID
  const secretKey = process.env.QOREID_SECRET_KEY

  if (!clientId || !secretKey) {
    throw new Error('QoreID is not configured — set QOREID_CLIENT_ID and QOREID_SECRET_KEY')
  }

  const res = await fetch(`${QOREID_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, secret: secretKey }),
  })

  if (!res.ok) {
    throw new Error('Failed to authenticate with QoreID')
  }

  const data = await res.json()
  cachedToken = {
    token: data.accessToken,
    // Refresh a minute early to be safe
    expiresAt: Date.now() + (data.expiresIn ?? 3300) * 1000 - 60_000,
  }

  return cachedToken.token
}

export type IdentityVerificationResult = {
  status: 'verified' | 'failed'
  providerResponse: unknown
  matchedName?: string
}

/**
 * Verifies an individual's NIN against the National Identity Database via QoreID.
 */
export async function verifyNin(nin: string, firstName: string, lastName: string): Promise<IdentityVerificationResult> {
  assertServerSide()

  const token = await getAccessToken()

  const res = await fetch(`${QOREID_BASE_URL}/v1/ng/identities/nin/${encodeURIComponent(nin)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstname: firstName,
      lastname: lastName,
    }),
  })

  // A provider outage must surface as "try again later", not be recorded as
  // the merchant's details failing to match.
  if (res.status >= 500 || res.status === 401 || res.status === 429) {
    throw new Error(`QoreID request failed with ${res.status}`)
  }
  const data = await res.json().catch(() => null)

  const status = data?.status?.state === 'complete' && data?.summary?.nin_check?.status === 'EXACT_MATCH'
    ? 'verified'
    : 'failed'

  return {
    status,
    providerResponse: data,
    matchedName: data?.nin_data ? `${data.nin_data.firstname ?? ''} ${data.nin_data.lastname ?? ''}`.trim() : undefined,
  }
}
