// Server-only. Never import this from a client component.
// Requires TERMII_API_KEY and TERMII_SENDER_ID in the environment (Vercel + .env.local).
// TERMII_BASE_URL and TERMII_CHANNEL are optional overrides.

// Termii shows each account's own base URL on its dashboard.
const TERMII_BASE_URL = (process.env.TERMII_BASE_URL || 'https://v3.api.termii.com').replace(/\/+$/, '').replace(/\/api$/, '')

// 'dnd' is Termii's transactional route: it reaches numbers on the
// Do-Not-Disturb list, which in Nigeria is most of them. 'generic' silently
// never delivers to those numbers, so OTPs on it often don't arrive.
const TERMII_CHANNEL = process.env.TERMII_CHANNEL || 'dnd'

function assertServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('termii.ts must only be called from server code')
  }
}

/**
 * Sends an SMS via Termii. Used for OTP delivery to Nigerian phone numbers.
 * Expects phone in international format, e.g. 2348012345678.
 */
export async function sendSms(phone: string, message: string) {
  assertServerSide()

  const apiKey = process.env.TERMII_API_KEY
  const senderId = process.env.TERMII_SENDER_ID

  if (!apiKey || !senderId) {
    throw new Error('Termii is not configured — set TERMII_API_KEY and TERMII_SENDER_ID')
  }

  const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      from: senderId,
      sms: message,
      type: 'plain',
      channel: TERMII_CHANNEL,
      api_key: apiKey,
    }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok || !data || data.code === 'error') {
    throw new Error(`Termii send failed (${res.status}): ${data?.message ?? 'no response body'}`)
  }

  return data
}

/**
 * Normalizes a Nigerian mobile number to international format without the plus sign
 * (2348012345678). Accepts 08012345678, 8012345678, +2348012345678,
 * 2348012345678, +234 (0) 801 234 5678 and 002348012345678.
 */
export function normalizeNigerianPhone(raw: string): string {
  let digits = (raw ?? '').replace(/\D/g, '')

  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('234')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)

  // Nigerian mobile numbers are 10 digits after the country code: 70x, 80x, 81x, 90x, 91x.
  if (!/^[789][01]\d{8}$/.test(digits)) {
    throw new Error('Enter a valid Nigerian phone number')
  }
  return `234${digits}`
}
