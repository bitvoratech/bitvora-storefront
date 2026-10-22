import { NextResponse, type NextRequest } from 'next/server'
import { isValidSignature } from '../../../../lib/paystack'
import { applyWebhookEvent } from '../../../../lib/billing'

// Paystack calls this for plan payments, renewals and cancellations. Set it as
// the webhook URL in the Paystack dashboard: https://app.bitvoratech.com/api/paystack/webhook
export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (!isValidSignature(raw, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: { event?: string; data?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }
  if (!body.event) return NextResponse.json({ ok: true })

  try {
    const handled = await applyWebhookEvent(body.event, body.data)
    // A non-2xx makes Paystack retry later, once the merchant can be matched.
    return handled ? NextResponse.json({ ok: true }) : NextResponse.json({ retry: true }, { status: 409 })
  } catch (error) {
    console.error('paystack webhook', body.event, error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
