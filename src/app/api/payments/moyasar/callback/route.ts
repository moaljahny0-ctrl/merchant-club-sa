import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchMoyasarPayment } from '@/lib/moyasar'
import { materializeOrdersForPayment } from '@/lib/actions/orders'

// GET /api/payments/moyasar/callback?payment_row_id=...
//
// Moyasar redirects the customer's browser here after a 3D Secure challenge
// (or immediately, for non-3DS methods). The query string also carries `id`
// (Moyasar's payment id) and `status`, but those are client-controlled —
// we re-fetch the payment from Moyasar server-side and trust only that.
export async function GET(request: NextRequest) {
  const paymentRowId = request.nextUrl.searchParams.get('payment_row_id')
  if (!paymentRowId) {
    return NextResponse.redirect(new URL('/store/checkout?payment_error=missing_reference', request.url))
  }

  const service = createServiceClient()
  const { data: paymentRow } = await service
    .from('payments')
    .select('id, moyasar_payment_id, cart_snapshot')
    .eq('id', paymentRowId)
    .maybeSingle()

  if (!paymentRow?.moyasar_payment_id) {
    return NextResponse.redirect(new URL('/store/checkout?payment_error=not_found', request.url))
  }

  const locale = (paymentRow.cart_snapshot as { locale?: string })?.locale === 'ar' ? '/ar' : ''

  let payment
  try {
    payment = await fetchMoyasarPayment(paymentRow.moyasar_payment_id)
  } catch {
    return NextResponse.redirect(new URL(`${locale}/store/checkout?payment_error=verification_failed`, request.url))
  }

  if (payment.status !== 'paid') {
    await service
      .from('payments')
      .update({
        status: payment.status === 'failed' ? 'failed' : 'initiated',
        failure_message: payment.source.message ?? null,
      })
      .eq('id', paymentRowId)
    return NextResponse.redirect(new URL(`${locale}/store/checkout?payment_error=declined`, request.url))
  }

  await service.from('payments').update({ status: 'paid' }).eq('id', paymentRowId)

  const result = await materializeOrdersForPayment(paymentRowId)
  if (result.error || result.orderNumbers.length === 0) {
    return NextResponse.redirect(new URL(`${locale}/store/checkout?payment_error=order_creation_failed`, request.url))
  }

  const orderParam = encodeURIComponent(result.orderNumbers.join(','))
  return NextResponse.redirect(new URL(`${locale}/store/order-confirmation?order=${orderParam}`, request.url))
}
