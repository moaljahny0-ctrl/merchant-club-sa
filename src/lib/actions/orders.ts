'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { redirect } from 'next/navigation'

export type OrderFormState = {
  error: string | null
  orderId: string | null
}

function generateOrderNumber(): string {
  const d = new Date()
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `MCO-${ymd}-${rand}`
}

export async function createOrder(
  _prev: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const productId = formData.get('product_id') as string
  const brandId   = formData.get('brand_id') as string
  const locale    = formData.get('locale') as string
  const slug      = formData.get('brand_slug') as string
  const name      = (formData.get('customer_name') as string)?.trim()
  const phone     = (formData.get('customer_phone') as string)?.trim()
  const email     = (formData.get('customer_email') as string)?.trim() || null
  const city      = (formData.get('customer_city') as string)?.trim()
  const address   = (formData.get('customer_address') as string)?.trim()
  const quantity  = Math.max(1, parseInt(formData.get('quantity') as string) || 1)
  const notes     = (formData.get('notes') as string)?.trim() || null

  if (!name || !phone || !city || !address) {
    return { error: 'Please fill in all required fields.', orderId: null }
  }
  if (phone.replace(/\D/g, '').length < 9) {
    return { error: 'Please enter a valid phone number.', orderId: null }
  }

  const service = createServiceClient()

  const { data: product } = await service
    .from('products')
    .select('id, title_en, title_ar, price, sale_price, stock_quantity, brands(name_en, contact_email, slug)')
    .eq('id', productId)
    .eq('status', 'live')
    .single()

  if (!product) {
    return { error: 'Product not found or no longer available.', orderId: null }
  }

  const stock = product.stock_quantity ?? 0
  if (stock < 1) {
    return { error: 'This product is out of stock.', orderId: null }
  }
  if (quantity > stock) {
    return { error: `Only ${stock} unit${stock === 1 ? '' : 's'} available.`, orderId: null }
  }

  const unitPrice = product.sale_price ? Number(product.sale_price) : Number(product.price)
  const subtotal  = unitPrice * quantity

  const { data: order, error: insertError } = await service
    .from('orders')
    .insert({
      order_number:     generateOrderNumber(),
      brand_id:         brandId,
      customer_name:    name,
      customer_phone:   phone,
      customer_email:   email,
      delivery_address: { city, address },
      items: [
        {
          product_id: productId,
          title:      product.title_en,
          quantity,
          unit_price: unitPrice,
          total:      subtotal,
        },
      ],
      subtotal,
      status:      'pending',
      brand_notes: notes,
    })
    .select('id, order_number')
    .single()

  if (insertError || !order) {
    return { error: 'Failed to place order. Please try again.', orderId: null }
  }

  // Notify brand by email — failure does not abort the order
  const brand = (product.brands as unknown) as { name_en: string; contact_email: string | null } | null
  if (brand?.contact_email && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Merchant Club SA <orders@merchantclubsa.com>',
        to:   [brand.contact_email],
        subject: `New Order ${order.order_number} — ${brand.name_en}`,
        html: `
          <div style="background:#0D0D0D;padding:40px;font-family:Georgia,serif;color:#F5F0E8;max-width:600px;">
            <p style="color:#D4AF37;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Merchant Club SA — New Order</p>
            <h2 style="font-weight:400;font-size:22px;margin:0 0 8px;">${order.order_number}</h2>
            <p style="color:#BFBFBF;font-size:13px;margin:0 0 28px;">
              A new order has been placed for <strong style="color:#F5F0E8;">${product.title_en}</strong>
            </p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
              <tr><td style="padding:9px 0;color:#BFBFBF;border-bottom:1px solid #2A2A2A;">Customer</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #2A2A2A;">${name}</td></tr>
              <tr><td style="padding:9px 0;color:#BFBFBF;border-bottom:1px solid #2A2A2A;">Phone</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #2A2A2A;">${phone}</td></tr>
              ${email ? `<tr><td style="padding:9px 0;color:#BFBFBF;border-bottom:1px solid #2A2A2A;">Email</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #2A2A2A;">${email}</td></tr>` : ''}
              <tr><td style="padding:9px 0;color:#BFBFBF;border-bottom:1px solid #2A2A2A;">City</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #2A2A2A;">${city}</td></tr>
              <tr><td style="padding:9px 0;color:#BFBFBF;border-bottom:1px solid #2A2A2A;">Address</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #2A2A2A;">${address}</td></tr>
              <tr><td style="padding:9px 0;color:#BFBFBF;border-bottom:1px solid #2A2A2A;">Qty × Price</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #2A2A2A;">${quantity} × SAR ${unitPrice.toFixed(2)}</td></tr>
              <tr><td style="padding:9px 0;color:#D4AF37;font-weight:bold;">Total</td><td style="padding:9px 0;color:#D4AF37;font-weight:bold;text-align:right;">SAR ${subtotal.toFixed(2)}</td></tr>
            </table>
            ${notes ? `<p style="color:#BFBFBF;font-size:12px;margin-bottom:24px;">Notes: ${notes}</p>` : ''}
            <p style="color:#555;font-size:11px;">Manage this order in your brand dashboard.</p>
          </div>
        `,
      })
    } catch (_) {
      // email failure does not abort the order
    }
  }

  const prefix = locale === 'ar' ? '/ar' : ''
  redirect(`${prefix}/brands/${slug}/products/${productId}/order/confirmation?id=${order.id}`)
}
