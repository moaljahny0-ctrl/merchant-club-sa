'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, assertPermission, logAdminAction, esc } from './_admin-utils'

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

export async function adminReviewProduct(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const user = await assertPermission('products.approve_reject')
    const service = createServiceClient()
    const now = new Date().toISOString()

    const { data: productWithBrand } = await service
      .from('products')
      .select('title_en, price, status, brands(name_en, slug, contact_email)')
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

    await logAdminAction({
      actorId: user.id,
      action: `product.${action}`,
      targetType: 'product',
      targetId: id,
      before: { status: productWithBrand?.status },
      after: { status: action === 'approve' ? 'live' : 'rejected', rejection_reason: rejectionReason },
    })

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
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { data: product } = await service
      .from('products')
      .select('status, brands(slug)')
      .eq('id', id)
      .single()

    const { error } = await service
      .from('products')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) return { error: error.message }

    await logAdminAction({
      actorId: admin.id,
      action: 'product.unpublish',
      targetType: 'product',
      targetId: id,
      before: { status: product?.status },
      after: { status: 'archived' },
    })

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
    const admin = await assertAdmin()
    const service = createServiceClient()

    const [{ data: product }, { data: images }] = await Promise.all([
      service.from('products').select('title_en, status, brands(slug)').eq('id', id).single(),
      service.from('product_images').select('storage_path').eq('product_id', id),
    ])

    if (images && images.length > 0) {
      const paths = images.map((i: { storage_path: string }) => i.storage_path).filter(Boolean)
      if (paths.length) await service.storage.from('product-images').remove(paths)
    }

    const { error } = await service.from('products').delete().eq('id', id)
    if (error) return { error: error.message }

    await logAdminAction({
      actorId: admin.id,
      action: 'product.delete',
      targetType: 'product',
      targetId: id,
      before: { title_en: product?.title_en, status: product?.status },
    })

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
