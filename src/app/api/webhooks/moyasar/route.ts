import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isWebhookAuthentic } from '@/lib/moyasar'
import { materializeOrdersForPayment } from '@/lib/actions/orders'

// POST /api/webhooks/moyasar
//
// Backstop for the 3DS callback redirect: if a customer completes payment on
// Moyasar's hosted 3DS page but closes the tab before being redirected back
// (or the redirect otherwise never reaches us), this is what confirms the
// payment and materializes the orders instead. Configure at
// https://dashboard.moyasar.com (or POST /v1/webhooks) with this URL, events
// payment_paid + payment_failed, and a shared_secret matching
// MOYASAR_WEBHOOK_SECRET below.
//
// Authenticity: Moyasar's webhook payload includes a `secret_token` field set
// to whatever `shared_secret` was configured for the webhook — there is no
// header-based HMAC signature, verification is a direct comparison.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || !isWebhookAuthentic(body.secret_token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const eventType = body.type as string | undefined
  const paymentData = body.data as { id?: string; status?: string; message?: string } | undefined
  const moyasarPaymentId = paymentData?.id

  if (!moyasarPaymentId) {
    return NextResponse.json({ ok: true }) // nothing to act on, acknowledge anyway
  }

  const service = createServiceClient()
  const { data: paymentRow } = await service
    .from('payments')
    .select('id, status')
    .eq('moyasar_payment_id', moyasarPaymentId)
    .maybeSingle()

  if (!paymentRow) {
    return NextResponse.json({ ok: true }) // unknown payment (e.g. test event) — acknowledge, nothing to do
  }

  if (eventType === 'payment_paid') {
    await service.from('payments').update({ status: 'paid' }).eq('id', paymentRow.id)
    await materializeOrdersForPayment(paymentRow.id)
  } else if (eventType === 'payment_failed' || eventType === 'payment_voided' || eventType === 'payment_abandoned') {
    // Never downgrade a payment that's already been confirmed paid (and
    // possibly already materialized into orders) from a late/out-of-order event.
    if (paymentRow.status !== 'paid') {
      await service
        .from('payments')
        .update({ status: 'failed', failure_message: paymentData?.message ?? eventType })
        .eq('id', paymentRow.id)
    }
  }

  return NextResponse.json({ ok: true })
}
