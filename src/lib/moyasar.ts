// Moyasar payment gateway client (server-only — uses the secret key).
//
// Test mode: sk_test_/pk_test_ keys work immediately after signing up at
// moyasar.com, no merchant approval needed. Swapping to sk_live_/pk_live_
// once the real merchant account is approved is an env var change only.
//
// Card numbers never reach this file or any other server code — the client
// tokenizes directly against Moyasar (see src/components/checkout/CardFields.tsx)
// using the publishable key, and only the resulting token is sent to us.

const MOYASAR_API_BASE = 'https://api.moyasar.com/v1'

function getSecretKey(): string {
  const key = process.env.MOYASAR_SECRET_KEY
  if (!key) throw new Error('MOYASAR_SECRET_KEY is not set')
  return key
}

function authHeader(): string {
  // Moyasar uses HTTP Basic Auth with the secret key as username, empty password.
  return 'Basic ' + Buffer.from(`${getSecretKey()}:`).toString('base64')
}

export type MoyasarPaymentStatus = 'initiated' | 'paid' | 'failed' | 'authorized' | 'captured' | 'refunded' | 'voided'

export type MoyasarPayment = {
  id: string
  status: MoyasarPaymentStatus
  amount: number
  currency: string
  description: string | null
  callback_url: string | null
  created_at: string
  source: {
    type: string
    company?: string
    name?: string
    number?: string
    transaction_url?: string
    message?: string
  }
}

export type CreatePaymentInput = {
  amountHalalas: number
  currency?: string
  description: string
  callbackUrl: string
  token: string
  metadata?: Record<string, string>
}

// Amount is in halalas (SAR minor unit) — Moyasar's `amount` field is an
// integer in the smallest currency unit, same convention as Stripe's cents.
export async function createMoyasarPayment(input: CreatePaymentInput): Promise<MoyasarPayment> {
  const res = await fetch(`${MOYASAR_API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: input.amountHalalas,
      currency: input.currency ?? 'SAR',
      description: input.description,
      callback_url: input.callbackUrl,
      source: { type: 'token', token: input.token },
      ...(input.metadata ? { metadata: input.metadata } : {}),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message ?? `Moyasar payment creation failed (${res.status})`)
  }
  return data as MoyasarPayment
}

// Always re-fetch payment status from Moyasar server-side before trusting it —
// the 3DS callback redirect carries an `id` and `status` in the query string,
// but query params are client-controlled and must never be the source of truth
// for "did we get paid."
export async function fetchMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  const res = await fetch(`${MOYASAR_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message ?? `Moyasar payment fetch failed (${res.status})`)
  }
  return data as MoyasarPayment
}

// Moyasar webhook payloads include a `secret_token` field set to whatever
// `shared_secret` value was configured when the webhook was created via
// POST /v1/webhooks — there is no header-based HMAC signature, verification
// is a direct string comparison against the secret we configured.
export function isWebhookAuthentic(payloadSecretToken: unknown): boolean {
  const expected = process.env.MOYASAR_WEBHOOK_SECRET
  return typeof expected === 'string' && expected.length > 0 && payloadSecretToken === expected
}
