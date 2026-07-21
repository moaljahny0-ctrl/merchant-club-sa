'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, assertPermission, logAdminAction, esc } from './_admin-utils'

function buildSuspensionEmailHtml(brandName: string, reason: string, siteUrl: string): string {
  void siteUrl
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border:1px solid #252525;">
        <tr>
          <td style="padding:40px 40px 28px;border-bottom:1px solid #252525;">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#cc5555;">Merchant Club SA — Account Notice</p>
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">Your account has been suspended.</h1>
            <p style="margin:0;font-size:14px;color:#777777;">${esc(brandName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 20px;font-size:14px;color:#CCCCCC;line-height:1.7;">
              Your brand storefront on Merchant Club SA has been temporarily suspended.
            </p>
            ${reason ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A2A2A;margin-bottom:24px;">
              <tr><td style="padding:16px 24px;background:#141414;">
                <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Reason</p>
                <p style="margin:0;font-size:14px;color:#CCCCCC;line-height:1.6;">${esc(reason)}</p>
              </td></tr>
            </table>` : ''}
            <p style="margin:0;font-size:13px;color:#777777;line-height:1.6;">
              To appeal or get more information, contact us at
              <a href="mailto:info@merchantclubsa.com" style="color:#D4AF37;text-decoration:none;">info@merchantclubsa.com</a>.
            </p>
          </td>
        </tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #252525;">
          <p style="margin:0;font-size:10px;color:#444444;letter-spacing:0.1em;">merchantclubsa.com &nbsp;·&nbsp; info@merchantclubsa.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildOnboardingStateEmailHtml(brandName: string, state: string, siteUrl: string): string {
  const messages: Record<string, { headline: string; body: string; cta?: string }> = {
    account_setup: {
      headline: 'Your account is ready.',
      body: 'Log in to your dashboard and complete your brand profile.',
      cta: `${siteUrl}/dashboard/brand/profile`,
    },
    profile_setup: {
      headline: 'Profile received.',
      body: 'Our team is reviewing your brand profile. We\'ll be in touch shortly.',
    },
    products_setup: {
      headline: 'Profile approved.',
      body: 'Your profile has been reviewed. Add your products to your dashboard.',
      cta: `${siteUrl}/dashboard/brand/products`,
    },
    submitted: {
      headline: 'Storefront submitted.',
      body: 'Your storefront has been submitted for review. We\'ll notify you once it\'s approved.',
    },
    live: {
      headline: 'You\'re live!',
      body: 'Your brand storefront is now live on Merchant Club SA. Customers can discover and purchase your products.',
      cta: `${siteUrl}/en/brands`,
    },
  }

  const msg = messages[state] ?? {
    headline: 'Account updated.',
    body: 'Your brand account status has been updated.',
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border:1px solid #252525;">
        <tr>
          <td style="padding:40px 40px 28px;border-bottom:1px solid #252525;">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#D4AF37;">Merchant Club SA</p>
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">${esc(msg.headline)}</h1>
            <p style="margin:0;font-size:14px;color:#777777;">${esc(brandName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 24px;font-size:14px;color:#CCCCCC;line-height:1.7;">${esc(msg.body)}</p>
            ${msg.cta ? `<table cellpadding="0" cellspacing="0">
              <tr><td style="background:#D4AF37;">
                <a href="${esc(msg.cta)}" style="display:inline-block;padding:16px 36px;font-size:11px;font-family:Georgia,serif;letter-spacing:0.2em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;font-weight:600;">Go to dashboard →</a>
              </td></tr>
            </table>` : ''}
          </td>
        </tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #252525;">
          <p style="margin:0;font-size:10px;color:#444444;letter-spacing:0.1em;">merchantclubsa.com &nbsp;·&nbsp; info@merchantclubsa.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function adminUpdateBrandStatus(
  brandId: string,
  status: 'approved' | 'suspended' | 'active',
  reason?: string
): Promise<{ error: string | null }> {
  try {
    const actor = await assertPermission('brands.approve_suspend')
    const service = createServiceClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

    const { data: brand } = await service
      .from('brands')
      .select('name_en, contact_email, status')
      .eq('id', brandId)
      .single()

    const { error } = await service
      .from('brands')
      .update({ status })
      .eq('id', brandId)

    if (error) return { error: error.message }

    await logAdminAction({
      actorId: actor.id,
      action: `brand.status_${status}`,
      targetType: 'brand',
      targetId: brandId,
      before: { status: brand?.status },
      after: { status },
    })

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey && brand?.contact_email && status === 'suspended') {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: 'Merchant Club SA <applications@merchantclubsa.com>',
          to: [brand.contact_email],
          subject: `Your Merchant Club SA account has been suspended — ${brand.name_en}`,
          html: buildSuspensionEmailHtml(brand.name_en, reason ?? '', siteUrl),
        })
      } catch (emailErr) {
        console.error('[admin] Suspension email failed:', emailErr)
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/brands')
  return { error: null }
}

export async function adminUpdateBrandOnboardingState(
  brandId: string,
  onboarding_state: 'invited' | 'account_setup' | 'profile_setup' | 'products_setup' | 'submitted' | 'live'
): Promise<{ error: string | null }> {
  try {
    await assertAdmin()
    const service = createServiceClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

    const { data: brand } = await service
      .from('brands')
      .select('name_en, contact_email')
      .eq('id', brandId)
      .single()

    const { error } = await service
      .from('brands')
      .update({ onboarding_state })
      .eq('id', brandId)

    if (error) return { error: error.message }

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey && brand?.contact_email && onboarding_state !== 'invited') {
      try {
        const resend = new Resend(apiKey)
        const subjectMap: Record<string, string> = {
          account_setup: 'Your account is ready',
          profile_setup: 'Profile received — under review',
          products_setup: 'Profile approved — add your products',
          submitted: 'Storefront submitted for review',
          live: "You're live on Merchant Club SA!",
        }
        await resend.emails.send({
          from: 'Merchant Club SA <applications@merchantclubsa.com>',
          to: [brand.contact_email],
          subject: `${subjectMap[onboarding_state] ?? 'Account updated'} — ${brand.name_en}`,
          html: buildOnboardingStateEmailHtml(brand.name_en, onboarding_state, siteUrl),
        })
      } catch (emailErr) {
        console.error('[admin] Onboarding state email failed:', emailErr)
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/brands')
  revalidatePath('/dashboard/brand')
  return { error: null }
}
