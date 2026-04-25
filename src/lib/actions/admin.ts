'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.id)

  const isAdmin = (data ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'platform_admin')
    }
  )

  if (!isAdmin) throw new Error('Forbidden')
  return user
}

// ── slug ──────────────────────────────────────────────────────────────────────

type ServiceClient = ReturnType<typeof createServiceClient>

async function generateUniqueSlug(service: ServiceClient, name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'brand'

  let slug = base
  let attempt = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await service.from('brands').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ── approval email ────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildApprovalEmailHtml(brandName: string, email: string, tempPassword: string, siteUrl: string): string {
  const loginUrl = `${siteUrl}/auth/login`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border:1px solid #252525;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 28px;border-bottom:1px solid #252525;">
              <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#D4AF37;">
                Merchant Club SA
              </p>
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">
                Your application is approved.
              </h1>
              <p style="margin:0;font-size:14px;color:#777777;">
                ${esc(brandName)}
              </p>
            </td>
          </tr>

          <!-- Credentials -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#D4AF37;">
                Your account is ready
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#FFFFFF;line-height:1.7;font-weight:400;">
                We've created your brand account. Use the credentials below to log in for the first time.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A2A2A;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #2A2A2A;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Email</p>
                    <p style="margin:0;font-size:14px;color:#FFFFFF;font-family:monospace,Georgia,serif;">${esc(email)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Temporary password</p>
                    <p style="margin:0;font-size:14px;color:#FFFFFF;font-family:monospace,Georgia,serif;">${esc(tempPassword)}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#D4AF37;">
                    <a href="${esc(loginUrl)}"
                       style="display:inline-block;padding:18px 40px;font-size:12px;font-family:Georgia,serif;letter-spacing:0.2em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;font-weight:600;">
                      Log in to your dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:12px;color:#555555;line-height:1.6;">
                After logging in, go to <strong style="color:#777777;">Profile → Change password</strong> to set your own password.
              </p>
            </td>
          </tr>

          <!-- What to do first -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252525;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #252525;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#D4AF37;">Step 1 — Log in</p>
                    <p style="margin:0;font-size:13px;color:#CCCCCC;line-height:1.6;">Use the email and temporary password above to log in at <a href="${esc(loginUrl)}" style="color:#D4AF37;text-decoration:none;">merchantclubsa.com/auth/login</a>.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #252525;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Step 2 — Add your first product</p>
                    <p style="margin:0;font-size:13px;color:#CCCCCC;line-height:1.6;">From your dashboard, go to <strong style="color:#FFFFFF;">Products → Add product</strong>. Enter the name, price, a short description, and an image.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Step 3 — Submit for review</p>
                    <p style="margin:0;font-size:13px;color:#CCCCCC;line-height:1.6;">Once your product is ready, submit it. Our team reviews it before it goes live on the platform.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What you can do -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0 0 14px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#555555;">As a brand owner you can</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right:12px;padding-bottom:10px;vertical-align:top;">
                    <p style="margin:0;font-size:12px;color:#AAAAAA;line-height:1.6;">✓ &nbsp;Add and edit your products</p>
                    <p style="margin:0;font-size:12px;color:#AAAAAA;line-height:1.6;">✓ &nbsp;Set prices in SAR</p>
                  </td>
                  <td width="50%" style="padding-left:12px;padding-bottom:10px;vertical-align:top;">
                    <p style="margin:0;font-size:12px;color:#AAAAAA;line-height:1.6;">✓ &nbsp;Upload product images</p>
                    <p style="margin:0;font-size:12px;color:#AAAAAA;line-height:1.6;">✓ &nbsp;Submit products for review</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #252525;">
              <p style="margin:0;font-size:10px;color:#444444;letter-spacing:0.1em;">
                merchantclubsa.com &nbsp;·&nbsp; info@merchantclubsa.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── applications ──────────────────────────────────────────────────────────────

export async function reviewApplication(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()
    const now = new Date().toISOString()

    // ── Rejection ─────────────────────────────────────────────────────────────
    if (action === 'reject') {
      const { error } = await service
        .from('brand_applications')
        .update({
          status: 'rejected',
          reviewed_by: admin.id,
          reviewed_at: now,
          rejection_reason: rejectionReason ?? '',
        })
        .eq('id', id)

      if (error) return { error: error.message }
      revalidatePath('/dashboard/admin/applications')
      return { error: null }
    }

    // ── Approval ──────────────────────────────────────────────────────────────

    // 1. Fetch the application
    const { data: app, error: fetchErr } = await service
      .from('brand_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !app) return { error: fetchErr?.message ?? 'Application not found' }
    if (app.status !== 'pending') return { error: `Application is already ${app.status}` }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

    // 2. Generate a temporary password and create the auth user
    const tempPassword = Array.from(
      { length: 12 },
      () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('')

    let userId: string
    const { data: newUser, error: createErr } = await service.auth.admin.createUser({
      email: app.contact_email,
      password: tempPassword,
      email_confirm: true,
    })

    if (createErr) {
      // User already exists — find them and reset their password
      const { data: listData, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 })
      if (listErr) return { error: listErr.message }
      const existing = listData.users.find(u => u.email === app.contact_email)
      if (!existing) return { error: `Could not create or locate user: ${createErr.message}` }
      userId = existing.id
      await service.auth.admin.updateUserById(userId, { password: tempPassword })
    } else {
      userId = newUser.user.id
    }

    // 4. Generate a unique slug from the brand name
    const slug = await generateUniqueSlug(service, app.brand_name_en)

    // 5. Create the brand record
    const { data: brand, error: brandErr } = await service
      .from('brands')
      .insert({
        slug,
        name_en: app.brand_name_en,
        name_ar: app.brand_name_ar ?? null,
        contact_email: app.contact_email,
        contact_phone: app.contact_phone ?? null,
        website_url: app.website_url ?? null,
        status: 'approved',
        onboarding_state: 'invited',
      })
      .select('id')
      .single()

    if (brandErr || !brand) return { error: brandErr?.message ?? 'Failed to create brand' }

    // 6. Link user to brand as owner
    const { error: memberErr } = await service
      .from('brand_members')
      .insert({
        brand_id: brand.id,
        user_id: userId,
        role: 'brand_owner',
        invited_by: admin.id,
        status: 'active',
        joined_at: now,
      })

    if (memberErr) return { error: memberErr.message }

    // 7. Assign brand_owner role
    const { data: roleRow } = await service
      .from('roles')
      .select('id')
      .eq('name', 'brand_owner')
      .single()

    if (roleRow) {
      await service
        .from('user_roles')
        .upsert({ user_id: userId, role_id: roleRow.id })
    }

    // 8. Mark application approved
    const { error: appUpdateErr } = await service
      .from('brand_applications')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: now,
        brand_id: brand.id,
      })
      .eq('id', id)

    if (appUpdateErr) return { error: appUpdateErr.message }

    // 9. Send branded approval email via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: 'Merchant Club SA <applications@merchantclubsa.com>',
          to: [app.contact_email],
          subject: `Your application has been approved — ${app.brand_name_en}`,
          html: buildApprovalEmailHtml(app.brand_name_en, app.contact_email, tempPassword, siteUrl),
        })
      } catch (emailErr) {
        console.error('[admin] Approval email failed (account created):', emailErr)
        console.error('[admin] Temp password for manual delivery:', tempPassword)
      }
    } else {
      console.warn('[admin] RESEND_API_KEY not set — temp password for manual delivery:', tempPassword)
    }

  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/applications')
  return { error: null }
}

// ── product email builders ────────────────────────────────────────────────────

function buildProductApprovedHtml(productTitle: string, brandName: string, brandSlug: string, siteUrl: string): string {
  const storefrontUrl = `${siteUrl}/en/brands/${encodeURIComponent(brandSlug)}`
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
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">Your product is now live.</h1>
            <p style="margin:0;font-size:14px;color:#777777;">${esc(brandName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 24px;font-size:15px;color:#FFFFFF;line-height:1.7;">
              <strong style="color:#D4AF37;">${esc(productTitle)}</strong> has been approved and is now visible on your brand page.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="background:#D4AF37;">
                <a href="${esc(storefrontUrl)}" style="display:inline-block;padding:16px 36px;font-size:11px;font-family:Georgia,serif;letter-spacing:0.2em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;font-weight:600;">View your storefront →</a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">Customers can now discover and purchase this product through your brand page on Merchant Club SA.</p>
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

function buildProductRejectedHtml(productTitle: string, brandName: string, productId: string, reason: string, siteUrl: string): string {
  const editUrl = `${siteUrl}/dashboard/brand/products/${encodeURIComponent(productId)}`
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
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">Your product was not approved.</h1>
            <p style="margin:0;font-size:14px;color:#777777;">${esc(brandName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#FFFFFF;line-height:1.7;">
              <strong style="color:#CCCCCC;">${esc(productTitle)}</strong> did not pass our review.
            </p>
            ${reason ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A2A2A;margin-bottom:24px;">
              <tr><td style="padding:16px 24px;background:#141414;">
                <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Reason</p>
                <p style="margin:0;font-size:14px;color:#CCCCCC;line-height:1.6;">${esc(reason)}</p>
              </td></tr>
            </table>` : ''}
            <p style="margin:0 0 24px;font-size:13px;color:#777777;line-height:1.6;">Make the necessary changes and resubmit for review.</p>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="background:#D4AF37;">
                <a href="${esc(editUrl)}" style="display:inline-block;padding:16px 36px;font-size:11px;font-family:Georgia,serif;letter-spacing:0.2em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;font-weight:600;">Edit product →</a>
              </td></tr>
            </table>
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

// ── products ──────────────────────────────────────────────────────────────────

export async function adminReviewProduct(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const user = await assertAdmin()
    const service = createServiceClient()
    const now = new Date().toISOString()

    const { data: productWithBrand } = await service
      .from('products')
      .select('title_en, price, brands(name_en, slug, contact_email)')
      .eq('id', id)
      .single()

    const { error } = await service
      .from('products')
      .update({
        status: action === 'approve' ? 'live' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: now,
        ...(action === 'approve' ? { published_at: now } : {}),
        ...(action === 'reject' ? { rejection_reason: rejectionReason ?? '' } : {}),
      })
      .eq('id', id)

    if (error) return { error: error.message }

    type BrandRef = { name_en: string; slug: string; contact_email: string | null }
    const brand = productWithBrand?.brands as unknown as BrandRef | null
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

    if (action === 'approve' && brand?.slug) {
      revalidatePath(`/en/brands/${brand.slug}`)
      revalidatePath(`/ar/brands/${brand.slug}`)
    }

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey && brand?.contact_email && productWithBrand?.title_en) {
      try {
        const resend = new Resend(apiKey)
        if (action === 'approve') {
          await resend.emails.send({
            from: 'Merchant Club SA <applications@merchantclubsa.com>',
            to: [brand.contact_email],
            subject: `Your product is now live — ${productWithBrand.title_en}`,
            html: buildProductApprovedHtml(productWithBrand.title_en, brand.name_en, brand.slug, siteUrl),
          })
        } else {
          await resend.emails.send({
            from: 'Merchant Club SA <applications@merchantclubsa.com>',
            to: [brand.contact_email],
            subject: `Your product was not approved — ${productWithBrand.title_en}`,
            html: buildProductRejectedHtml(productWithBrand.title_en, brand.name_en, id, rejectionReason ?? '', siteUrl),
          })
        }
      } catch (emailErr) {
        console.error('[admin] Product review email failed:', emailErr)
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/products')
  return { error: null }
}

export async function adminUnpublishProduct(id: string): Promise<{ error: string | null }> {
  try {
    await assertAdmin()
    const service = createServiceClient()

    const { data: product } = await service
      .from('products')
      .select('brands(slug)')
      .eq('id', id)
      .single()

    const { error } = await service
      .from('products')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) return { error: error.message }

    const slug = (product?.brands as { slug?: string } | null)?.slug
    if (slug) {
      revalidatePath(`/en/brands/${slug}`)
      revalidatePath(`/ar/brands/${slug}`)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/products')
  return { error: null }
}

export async function adminDeleteProduct(id: string): Promise<{ error: string | null }> {
  try {
    await assertAdmin()
    const service = createServiceClient()

    const [{ data: product }, { data: images }] = await Promise.all([
      service.from('products').select('brands(slug)').eq('id', id).single(),
      service.from('product_images').select('storage_path').eq('product_id', id),
    ])

    if (images && images.length > 0) {
      const paths = images.map((i: { storage_path: string }) => i.storage_path).filter(Boolean)
      if (paths.length) await service.storage.from('product-images').remove(paths)
    }

    const { error } = await service.from('products').delete().eq('id', id)
    if (error) return { error: error.message }

    const slug = (product?.brands as { slug?: string } | null)?.slug
    if (slug) {
      revalidatePath(`/en/brands/${slug}`)
      revalidatePath(`/ar/brands/${slug}`)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/products')
  return { error: null }
}

// ── brands ────────────────────────────────────────────────────────────────────

export async function adminUpdateBrandStatus(
  brandId: string,
  status: 'approved' | 'suspended' | 'active'
): Promise<{ error: string | null }> {
  try {
    await assertAdmin()
    const service = createServiceClient()

    const { error } = await service
      .from('brands')
      .update({ status })
      .eq('id', brandId)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/brands')
  return { error: null }
}
