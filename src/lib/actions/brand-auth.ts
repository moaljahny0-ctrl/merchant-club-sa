'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildPasswordResetEmailHtml } from '@/lib/email'
import { randomBytes, createHash } from 'crypto'

// Password reset for brand/admin/creator accounts — these stay on Supabase
// Auth for identity (unlike customers), but the reset step itself is a
// custom token + Resend-branded email, matching sendCustomerPasswordReset
// in lib/actions/customers.ts. Avoids Supabase's own mailer (unbranded
// sending domain) and its PKCE code-exchange (fails if the link is opened
// in a different browser/device than the one that requested it).

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

export async function sendBrandPasswordReset(email: string): Promise<void> {
  const service = createServiceClient()
  const normalizedEmail = email.toLowerCase().trim()

  // No direct "get user by email" admin call — list and find, same as the
  // existing brand-approval/member-invite code in admin-applications.ts.
  const { data: listData, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) {
    console.error('[brand-reset] listUsers failed:', listErr.message)
    return
  }
  const user = listData.users.find(u => u.email === normalizedEmail)

  // Same response regardless of whether the account exists — don't leak
  // which emails are registered.
  if (!user) {
    console.log('[brand-reset] no user found for:', normalizedEmail)
    return
  }

  const rawToken = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error: insertError } = await service.from('brand_password_reset_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (insertError) {
    console.error('[brand-reset] token insert failed:', insertError.message)
    return
  }

  const resetLink = `${SITE_URL}/auth/reset-password/confirm?token=${rawToken}`

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset your password — Merchant Club SA',
      html: buildPasswordResetEmailHtml({ resetLink }),
    })
  } catch (err) {
    console.error('[brand-reset] EMAIL FAILED:', err)
  }
}

export async function resetBrandPassword(
  rawToken: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const service = createServiceClient()
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const { data: tokenRow } = await service
    .from('brand_password_reset_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!tokenRow) return { error: 'This link is invalid.' }
  if (tokenRow.used_at) return { error: 'This link has already been used.' }
  if (new Date(tokenRow.expires_at) < new Date()) return { error: 'This link has expired. Please request a new one.' }

  const { error: updateError } = await service.auth.admin.updateUserById(tokenRow.user_id, { password: newPassword })
  if (updateError) return { error: updateError.message }

  await service
    .from('brand_password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  return { error: null }
}
