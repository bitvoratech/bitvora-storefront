import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { verifyTransaction } from '../../../lib/paystack'
import { recordPayment } from '../../../lib/billing'

// Where Paystack sends the merchant after paying. The webhook records the
// payment too; checking here means the plan shows as paid straight away.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const reference = searchParams.get('reference') ?? searchParams.get('trxref')
  const back = (query: string) => NextResponse.redirect(new URL(`/billing?${query}`, origin))
  if (!reference) return back('payment=failed')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', origin))
  const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single()
  if (!merchant) return back('payment=failed')

  try {
    const tx = await verifyTransaction(reference)
    const recorded = await recordPayment(tx, { expectMerchantId: merchant.id })
    return back(recorded ? 'payment=success' : 'payment=failed')
  } catch (error) {
    console.error('billing callback', reference, error)
    return back('payment=pending')
  }
}
