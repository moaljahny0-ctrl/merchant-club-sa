'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  sendOrderEmail,
  buildOrderPlacedCustomerHtml,
  buildOrderPlacedBrandHtml,
  buildOrderStatusHtml,
} from '@/lib/email'

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

  // Decrement stock — fire-and-forget, never blocks the order
  const newStock = Math.max(0, (product.stock_quantity ?? 0) - quantity)
  const stockUpdate: Record<string, unknown> = { stock_quantity: newStock }
  if (newStock === 0) stockUpdate.status = 'out_of_stock'
  service
    .from('products')
    .update(stockUpdate)
    .eq('id', productId)
    .then(({ error }) => {
      if (error) console.error('[stock] decrement failed:', error)
    })

  const brand = (product.brands as unknown) as { name_en: string; contact_email: string | null } | null

  // Email A — customer confirmation
  if (email) {
    sendOrderEmail({
      to: email,
      subject: `Order Confirmed — #${order.order_number}`,
      html: buildOrderPlacedCustomerHtml({
        customerName: name,
        orderNumber:  order.order_number,
        productTitle: product.title_en,
        quantity,
        unitPrice,
        subtotal,
        city,
        address,
      }),
    }).catch(console.error)
  }

  // Email B — brand notification
  if (brand?.contact_email) {
    sendOrderEmail({
      to: brand.contact_email,
      subject: `New Order — #${order.order_number}`,
      html: buildOrderPlacedBrandHtml({
        brandName:    brand.name_en,
        orderNumber:  order.order_number,
        customerName: name,
        customerPhone: phone,
        city,
        productTitle: product.title_en,
        quantity,
        subtotal,
      }),
    }).catch(console.error)
  }

  const prefix = locale === 'ar' ? '/ar' : ''
  redirect(`${prefix}/brands/${slug}/products/${productId}/order/confirmation?id=${order.id}`)
}

export async function brandUpdateOrderStatus(
  orderId: string,
  newStatus: 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
  trackingNumber?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const service = createServiceClient()

    const { data: order } = await service
      .from('orders')
      .select('id, brand_id, status, order_number, customer_name, customer_email, items, subtotal, tracking_number')
      .eq('id', orderId)
      .single()

    if (!order) return { error: 'Order not found' }

    // Verify caller is an active member of the brand
    const { data: member } = await supabase
      .from('brand_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('brand_id', order.brand_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!member) return { error: 'Forbidden' }

    const allowed: Record<string, string[]> = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['shipped',   'cancelled'],
      shipped:   ['delivered'],
    }
    if (!allowed[order.status]?.includes(newStatus)) {
      return { error: `Cannot transition from ${order.status} to ${newStatus}` }
    }

    const resolvedTracking = newStatus === 'shipped' ? (trackingNumber?.trim() || null) : null
    const update: Record<string, unknown> = { status: newStatus }
    if (resolvedTracking) update.tracking_number = resolvedTracking

    const { error } = await service
      .from('orders')
      .update(update)
      .eq('id', orderId)

    if (error) return { error: error.message }

    // Status-change email to customer (fire-and-forget)
    type OrderItem = { title?: string }
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []
    const productTitle = items[0]?.title ?? 'Your item'

    if (order.customer_email) {
      const subjects: Record<string, string> = {
        confirmed: `Order Confirmed — #${order.order_number}`,
        shipped:   `Your Order Has Shipped — #${order.order_number}`,
        delivered: `Order Delivered — #${order.order_number}`,
        cancelled: `Order Cancelled — #${order.order_number}`,
      }
      sendOrderEmail({
        to: order.customer_email as string,
        subject: subjects[newStatus] ?? `Order Update — #${order.order_number}`,
        html: buildOrderStatusHtml({
          customerName:   (order.customer_name as string | null) ?? 'Customer',
          orderNumber:    order.order_number as string,
          productTitle,
          subtotal:       Number(order.subtotal),
          status:         newStatus,
          trackingNumber: resolvedTracking ?? (order.tracking_number as string | null) ?? undefined,
        }),
      }).catch(console.error)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/orders')
  return { error: null }
}
