'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword, verifyPassword, createSession, clearSession } from '@/lib/customer-auth'
import { sendEmail, buildWelcomeEmailHtml, buildPasswordResetEmailHtml } from '@/lib/email'
import { randomBytes, createHash } from 'crypto'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

export async function registerCustomer(
  fullName: string,
  phone: string,
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const service = createServiceClient()

  const { data: existing } = await service
    .from('customers')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) return { error: 'البريد الإلكتروني مسجل بالفعل.' }

  const password_hash = await hashPassword(password)

  const { data: customer, error: insertError } = await service
    .from('customers')
    .insert({ full_name: fullName.trim(), phone: phone.trim(), email: email.toLowerCase().trim(), password_hash })
    .select('id, email, full_name, phone')
    .single()

  if (insertError || !customer) return { error: insertError?.message ?? 'فشل إنشاء الحساب.' }

  // Link guest orders placed with the same phone number
  if (phone.trim()) {
    service
      .from('orders')
      .update({ customer_user_id: customer.id })
      .eq('customer_phone', phone.trim())
      .is('customer_user_id', null)
      .then(({ error }) => { if (error) console.error('[customers] order link failed:', error) })
  }

  await createSession({ id: customer.id, email: customer.email, full_name: customer.full_name, phone: customer.phone })

  sendEmail({
    to: customer.email,
    subject: 'مرحباً في Merchant Club SA',
    html: buildWelcomeEmailHtml({ fullName: customer.full_name }),
  }).catch(err => console.error('[customers] welcome email failed:', err))

  return { error: null }
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const service = createServiceClient()

  const { data: customer } = await service
    .from('customers')
    .select('id, email, full_name, phone, password_hash')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (!customer) return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }

  const valid = await verifyPassword(password, customer.password_hash)
  if (!valid) return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }

  await createSession({ id: customer.id, email: customer.email, full_name: customer.full_name, phone: customer.phone })

  return { error: null }
}

export async function logoutCustomer(): Promise<void> {
  await clearSession()
}

export async function sendCustomerPasswordReset(email: string): Promise<void> {
  const service = createServiceClient()
  const normalizedEmail = email.toLowerCase().trim()

  const { data: customer, error: lookupError } = await service
    .from('customers')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lookupError) {
    console.error('[reset] customer lookup failed:', lookupError.message, '| email:', normalizedEmail)
    return
  }
  if (!customer) {
    console.log('[reset] no customer found for:', normalizedEmail)
    return
  }

  const rawToken = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error: insertError } = await service.from('customer_reset_tokens').insert({
    customer_id: customer.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (insertError) {
    console.error('[reset] token insert failed:', insertError.message)
    return
  }

  const resetLink = `${SITE_URL}/store/reset-password?token=${rawToken}`
  console.log('[reset] sending email to:', normalizedEmail, '| link:', resetLink)

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'إعادة تعيين كلمة المرور — Merchant Club SA',
      html: buildPasswordResetEmailHtml({ resetLink }),
    })
    console.log('[reset] email sent successfully to:', normalizedEmail)
  } catch (err) {
    console.error('[reset] EMAIL FAILED:', err)
  }
}

export async function resetCustomerPassword(
  rawToken: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const service = createServiceClient()

  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const { data: tokenRow } = await service
    .from('customer_reset_tokens')
    .select('id, customer_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!tokenRow) return { error: 'الرابط غير صالح.' }
  if (tokenRow.used_at) return { error: 'تم استخدام هذا الرابط مسبقاً.' }
  if (new Date(tokenRow.expires_at) < new Date()) return { error: 'انتهت صلاحية الرابط. يرجى طلب رابط جديد.' }

  const password_hash = await hashPassword(newPassword)

  const { data: customer, error: updateError } = await service
    .from('customers')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', tokenRow.customer_id)
    .select('id, email, full_name, phone')
    .single()

  if (updateError || !customer) return { error: 'فشل تحديث كلمة المرور.' }

  await service
    .from('customer_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  await createSession({ id: customer.id, email: customer.email, full_name: customer.full_name, phone: customer.phone })

  return { error: null }
}
