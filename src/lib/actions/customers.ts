'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildWelcomeEmailHtml, buildPasswordResetEmailHtml } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

export async function setupCustomerProfile(
  fullName: string,
  phone: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const service = createServiceClient()

  const { error: profileError } = await service
    .from('customer_profiles')
    .upsert(
      { id: user.id, full_name: fullName, phone, email: user.email ?? null },
      { onConflict: 'id' }
    )

  if (profileError) return { error: profileError.message }

  // Tag user as customer in app_metadata — lets middleware detect role without a DB query
  await service.auth.admin.updateUserById(user.id, {
    app_metadata: { role: 'customer' },
  })

  // Link unowned guest orders by phone — fire-and-forget
  service
    .from('orders')
    .update({ customer_user_id: user.id })
    .eq('customer_phone', phone)
    .is('customer_user_id', null)
    .then(({ error }) => {
      if (error) console.error('[customers] order link failed:', error)
    })

  return { error: null }
}

export async function sendWelcomeEmail(
  fullName: string,
  email: string
): Promise<void> {
  try {
    await sendEmail({
      to: email,
      subject: 'مرحباً في Merchant Club SA',
      html: buildWelcomeEmailHtml({ fullName }),
    })
  } catch (err) {
    console.error('[customers] welcome email failed:', err)
  }
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ error: string | null }> {
  const service = createServiceClient()

  try {
    const { data, error } = await service.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${SITE_URL}/auth/callback?next=/store/reset-password`,
      },
    })

    if (error || !data?.properties?.action_link) {
      // User not found or other error — don't reveal to caller
      return { error: null }
    }

    await sendEmail({
      to: email,
      subject: 'إعادة تعيين كلمة المرور — Merchant Club SA',
      html: buildPasswordResetEmailHtml({ resetLink: data.properties.action_link }),
    })
  } catch (err) {
    console.error('[customers] reset email failed:', err)
  }

  return { error: null }
}
