'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/actions/analytics'
import { createMoyasarPayment } from '@/lib/moyasar'
import {
  sendOrderEmail,
  buildOrderPlacedCustomerHtml,
  buildOrderPlacedBrandHtml,
  buildOrderPlacedAdminHtml,
  buildOrderStatusHtml,
  buildGuestInvitationHtml,
} from '@/lib/email'
import { getCustomerSession } from '@/lib/customer-auth'
import { randomInt } from 'crypto'
import type { CartItem } from '@/lib/cart/CartContext'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

async function resolveCreatorLinkId(brandId: string): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const ref = cookieStore.get('mc_ref')?.value
    if (!ref) return null
    const service = createServiceClient()
    const { data } = await service
      .from('creator_links')
      .select('id')
      .eq('link_code', decodeURIComponent(ref))
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .maybeSingle()
    return data?.id ?? null
  } catch {
    return null
  }
}

function generateOrderNumber(): string {
  const d = new Date()
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const rand = String(randomInt(100000, 999999))
  return `MCO-${ymd}-${rand}`
}

// ─── Cart validation + order materialization ──────────────────────────────────
//
// Shared by the immediate-paid path (initiatePayment, below) and the deferred
// path (3DS callback route + webhook route), so a checkout is only ever
// materialized into `orders` rows — and stock only ever decremented — once,
// through one code path, regardless of which of those three callers first
// sees the payment as `paid`.

type CartSnapshotItem = { brandId: string; productId: string; quantity: number }

type CartSnapshot = {
  cartItems: CartSnapshotItem[]
  customerUserId: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  customerCity: string
  customerAddress: string
  notes: string | null
  locale: string
}

type ValidatedGroup = {
  brandId: string
  orderItems: Array<{ product_id: string; title: string; quantity: number; unit_price: number; total: number }>
  subtotal: number
  brand: { name_en: string; contact_email: string | null } | null
}

async function validateCartGroups(
  cartItems: CartSnapshotItem[]
): Promise<{ error: string } | { groups: ValidatedGroup[]; total: number }> {
  const service = createServiceClient()
  const brandGroups = new Map<string, CartSnapshotItem[]>()
  for (const item of cartItems) {
    const group = brandGroups.get(item.brandId) ?? []
    group.push(item)
    brandGroups.set(item.brandId, group)
  }

  const groups: ValidatedGroup[] = []
  let total = 0

  for (const [brandId, items] of brandGroups) {
    const productIds = items.map(i => i.productId)
    const { data: products } = await service
      .from('products')
      .select('id, title_en, price, sale_price, stock_quantity, brands(name_en, contact_email)')
      .in('id', productIds)
      .eq('status', 'live')

    if (!products || products.length !== items.length) {
      return { error: 'One or more products are no longer available.' }
    }

    const orderItems: ValidatedGroup['orderItems'] = []
    let subtotal = 0

    for (const cartItem of items) {
      const product = products.find(p => p.id === cartItem.productId)
      if (!product) return { error: 'Product not found.' }

      const stock = product.stock_quantity ?? 0
      if (stock < cartItem.quantity) {
        return { error: `Only ${stock} unit${stock === 1 ? '' : 's'} of "${product.title_en}" available.` }
      }

      const unitPrice = product.sale_price ? Number(product.sale_price) : Number(product.price)
      const itemTotal = unitPrice * cartItem.quantity
      subtotal += itemTotal

      orderItems.push({
        product_id: cartItem.productId,
        title: product.title_en,
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        total: itemTotal,
      })
    }

    total += subtotal
    groups.push({
      brandId,
      orderItems,
      subtotal,
      brand: (products[0].brands as unknown) as { name_en: string; contact_email: string | null } | null,
    })
  }

  return { groups, total }
}

async function insertOrderForGroup(
  group: ValidatedGroup,
  snapshot: CartSnapshot,
  paymentId: string | null,
  cartItemsForGroup: CartSnapshotItem[]
): Promise<{ error: string | null; orderNumber: string | null }> {
  const service = createServiceClient()
  const orderNumber = generateOrderNumber()
  const creatorLinkId = await resolveCreatorLinkId(group.brandId)

  const { data: order, error: insertError } = await service
    .from('orders')
    .insert({
      order_number: orderNumber,
      brand_id: group.brandId,
      customer_user_id: snapshot.customerUserId,
      customer_name: snapshot.customerName,
      customer_phone: snapshot.customerPhone,
      customer_email: snapshot.customerEmail,
      delivery_address: { city: snapshot.customerCity, address: snapshot.customerAddress },
      items: group.orderItems,
      subtotal: group.subtotal,
      status: 'pending',
      brand_notes: snapshot.notes,
      payment_id: paymentId,
      ...(creatorLinkId ? { creator_link_id: creatorLinkId } : {}),
    })
    .select('id, order_number')
    .single()

  if (insertError || !order) {
    return { error: 'Failed to place order. Please try again.', orderNumber: null }
  }

  trackEvent({ event_type: 'order_placed', brand_id: group.brandId, creator_link_id: creatorLinkId }).catch(() => {})

  // Atomic stock decrement — conditional on stock still being available for each item.
  // Only runs here, at materialization time (payment already confirmed paid), not at
  // checkout submission — an abandoned or failed payment never reserves stock.
  let stockFailed = false
  for (const cartItem of cartItemsForGroup) {
    const { data: product } = await service
      .from('products')
      .select('stock_quantity')
      .eq('id', cartItem.productId)
      .single()
    const newStock = Math.max(0, (product?.stock_quantity ?? 0) - cartItem.quantity)
    const { data: decremented } = await service
      .from('products')
      .update({
        stock_quantity: newStock,
        ...(newStock === 0 ? { status: 'out_of_stock' } : {}),
      })
      .eq('id', cartItem.productId)
      .gte('stock_quantity', cartItem.quantity)
      .select('id')
    if (!decremented || decremented.length === 0) {
      stockFailed = true
      console.error(`[stock] OVERSELL on product ${cartItem.productId} order ${orderNumber} — stock taken concurrently, after payment was already captured`)
    }
  }
  if (stockFailed) {
    // Payment was already captured — this order is now a manual-refund case, not a
    // silent delete like the pre-payment flow used to do. Leave the order in place
    // flagged via brand_notes so admin/finance can see it and refund/replace it.
    await service
      .from('orders')
      .update({ brand_notes: `${snapshot.notes ?? ''}\n[SYSTEM] Oversold after payment captured — needs manual refund or restock.`.trim() })
      .eq('id', order.id)
  }

  const firstTitle = group.orderItems[0].title
  const firstQty = group.orderItems[0].quantity
  const extraItems = group.orderItems.length > 1 ? ` +${group.orderItems.length - 1} more` : ''
  const displayTitle = `${firstTitle}${extraItems}`

  if (snapshot.customerEmail) {
    sendOrderEmail({
      to: snapshot.customerEmail,
      subject: `Order Confirmed — #${orderNumber}`,
      html: buildOrderPlacedCustomerHtml({
        customerName: snapshot.customerName,
        orderNumber,
        productTitle: displayTitle,
        quantity: firstQty,
        unitPrice: group.orderItems[0].unit_price,
        subtotal: group.subtotal,
        city: snapshot.customerCity,
        address: snapshot.customerAddress,
      }),
    }).catch(err => console.error('[email] customer confirmation failed:', err))

    if (!snapshot.customerUserId) {
      service.from('customers').select('id').eq('phone', snapshot.customerPhone).maybeSingle()
        .then(({ data: existing }) => {
          if (!existing) {
            sendOrderEmail({
              to: snapshot.customerEmail!,
              subject: 'أكمل تسجيلك في Merchant Club SA',
              html: buildGuestInvitationHtml({ customerName: snapshot.customerName, orderNumber }),
            }).catch(err => console.error('[email] guest invitation failed:', err))
          }
        })
    }
  }

  if (group.brand?.contact_email) {
    sendOrderEmail({
      to: group.brand.contact_email,
      subject: `New Order — #${orderNumber}`,
      html: buildOrderPlacedBrandHtml({
        brandName: group.brand.name_en,
        orderNumber,
        customerName: snapshot.customerName,
        customerPhone: snapshot.customerPhone,
        city: snapshot.customerCity,
        productTitle: displayTitle,
        quantity: firstQty,
        subtotal: group.subtotal,
      }),
    }).catch(err => console.error('[email] brand notification failed:', err))
  }

  sendOrderEmail({
    to: 'info@merchantclubsa.com',
    subject: `[Admin] New Order — #${orderNumber}`,
    html: buildOrderPlacedAdminHtml({
      orderNumber,
      brandName: group.brand?.name_en ?? 'Unknown Brand',
      customerName: snapshot.customerName,
      customerPhone: snapshot.customerPhone,
      customerEmail: snapshot.customerEmail,
      city: snapshot.customerCity,
      productTitle: displayTitle,
      quantity: firstQty,
      subtotal: group.subtotal,
    }),
  }).catch(err => console.error('[email] admin notification failed:', err))

  return { error: null, orderNumber }
}

// Idempotent: safe to call more than once for the same payment (the 3DS
// callback route and the webhook route can both observe `payment_paid` for
// the same payment). Uses a conditional UPDATE as a claim/mutex — only the
// caller that successfully flips `orders_materialized_at` from null proceeds
// to create orders; everyone else just reads back what's already there.
export async function materializeOrdersForPayment(
  paymentRowId: string
): Promise<{ error: string | null; orderNumbers: string[] }> {
  const service = createServiceClient()

  const { data: claimed } = await service
    .from('payments')
    .update({ orders_materialized_at: new Date().toISOString() })
    .eq('id', paymentRowId)
    .is('orders_materialized_at', null)
    .select('id, cart_snapshot')
    .maybeSingle()

  if (!claimed) {
    // Already materialized by another caller — return the existing orders.
    const { data: existingOrders } = await service
      .from('orders')
      .select('order_number')
      .eq('payment_id', paymentRowId)
    return { error: null, orderNumbers: (existingOrders ?? []).map(o => o.order_number) }
  }

  const snapshot = claimed.cart_snapshot as CartSnapshot
  const validated = await validateCartGroups(snapshot.cartItems)
  if ('error' in validated) {
    // Payment was captured but stock disappeared underneath it in the meantime —
    // a real (if rare) edge case. Surface it, don't silently drop the payment.
    return { error: `Payment captured but ${validated.error} Contact support to arrange a refund.`, orderNumbers: [] }
  }

  const orderNumbers: string[] = []
  for (const group of validated.groups) {
    const cartItemsForGroup = snapshot.cartItems.filter(i => i.brandId === group.brandId)
    const result = await insertOrderForGroup(group, snapshot, paymentRowId, cartItemsForGroup)
    if (result.error || !result.orderNumber) {
      return { error: result.error, orderNumbers }
    }
    orderNumbers.push(result.orderNumber)
  }

  return { error: null, orderNumbers }
}

// ─── Checkout entry point (cart and single-item "buy now" both funnel here) ───

export type PlaceOrderInput = {
  cartItems: CartItem[]
  customerName: string
  customerPhone: string
  customerEmail: string | null
  customerCity: string
  customerAddress: string
  notes: string | null
  locale: string
  paymentMethod: 'card' | 'cod'
  paymentToken?: string // required when paymentMethod === 'card'
}

export type PlaceOrderResult =
  | { kind: 'error'; error: string }
  | { kind: 'redirect'; redirectUrl: string } // 3DS challenge — caller must navigate the browser here
  | { kind: 'success'; orderNumbers: string[] } // order(s) placed — paid immediately or COD

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input.customerName || !input.customerPhone || !input.customerCity || !input.customerAddress) {
    return { kind: 'error', error: 'Please fill in all required fields.' }
  }
  if (input.customerPhone.replace(/\D/g, '').length < 9) {
    return { kind: 'error', error: 'Please enter a valid phone number.' }
  }
  if (input.cartItems.length === 0) {
    return { kind: 'error', error: 'Your cart is empty.' }
  }
  if (input.paymentMethod === 'card' && !input.paymentToken) {
    return { kind: 'error', error: 'Payment details are required.' }
  }

  const session = await getCustomerSession()
  const cartItems: CartSnapshotItem[] = input.cartItems.map(i => ({
    brandId: i.brandId,
    productId: i.productId,
    quantity: i.quantity,
  }))

  const validated = await validateCartGroups(cartItems)
  if ('error' in validated) {
    return { kind: 'error', error: validated.error }
  }
  if (validated.total <= 0) {
    return { kind: 'error', error: 'Order total must be greater than zero.' }
  }

  const snapshot: CartSnapshot = {
    cartItems,
    customerUserId: session?.id ?? null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    customerCity: input.customerCity,
    customerAddress: input.customerAddress,
    notes: input.notes,
    locale: input.locale,
  }

  // ── Cash on delivery — no gateway involved, materialize immediately ──────────
  // (same behavior the platform has always had: create the order and decrement
  // stock right away, no payment confirmation to wait for).
  if (input.paymentMethod === 'cod') {
    const orderNumbers: string[] = []
    for (const group of validated.groups) {
      const cartItemsForGroup = cartItems.filter(i => i.brandId === group.brandId)
      const result = await insertOrderForGroup(group, snapshot, null, cartItemsForGroup)
      if (result.error || !result.orderNumber) {
        return { kind: 'error', error: result.error ?? 'Failed to place order. Please try again.' }
      }
      orderNumbers.push(result.orderNumber)
    }
    return { kind: 'success', orderNumbers }
  }

  // ── Card payment — defer order creation until Moyasar confirms payment ──────
  const paymentToken = input.paymentToken as string // validated non-empty above
  const service = createServiceClient()
  const { data: paymentRow, error: paymentRowError } = await service
    .from('payments')
    .insert({
      status: 'initiated',
      amount: validated.total,
      currency: 'SAR',
      cart_snapshot: snapshot,
      live: Boolean(process.env.MOYASAR_SECRET_KEY?.startsWith('sk_live_')),
    })
    .select('id')
    .single()

  if (paymentRowError || !paymentRow) {
    return { kind: 'error', error: 'Could not start payment. Please try again.' }
  }

  try {
    const payment = await createMoyasarPayment({
      amountHalalas: Math.round(validated.total * 100),
      description: `Merchant Club SA order — ${input.cartItems.length} item(s)`,
      callbackUrl: `${SITE_URL}/api/payments/moyasar/callback?payment_row_id=${paymentRow.id}`,
      token: paymentToken,
      metadata: { payment_row_id: paymentRow.id },
    })

    await service
      .from('payments')
      .update({
        moyasar_payment_id: payment.id,
        status: payment.status === 'paid' ? 'paid' : payment.status === 'failed' ? 'failed' : 'initiated',
        source_type: payment.source.type,
        card_brand: payment.source.company ?? null,
        card_last4: payment.source.number?.slice(-4) ?? null,
        transaction_url: payment.source.transaction_url ?? null,
        failure_message: payment.status === 'failed' ? payment.source.message ?? null : null,
      })
      .eq('id', paymentRow.id)

    if (payment.status === 'paid') {
      const result = await materializeOrdersForPayment(paymentRow.id)
      if (result.error) return { kind: 'error', error: result.error }
      return { kind: 'success', orderNumbers: result.orderNumbers }
    }

    if (payment.source.transaction_url) {
      return { kind: 'redirect', redirectUrl: payment.source.transaction_url }
    }

    if (payment.status === 'failed') {
      return { kind: 'error', error: payment.source.message ?? 'Payment failed. Please try a different card.' }
    }

    return { kind: 'error', error: 'Payment could not be started. Please try again.' }
  } catch (err) {
    await service
      .from('payments')
      .update({ status: 'failed', failure_message: err instanceof Error ? err.message : 'Unknown error' })
      .eq('id', paymentRow.id)
    return { kind: 'error', error: 'Payment failed. Please try again.' }
  }
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
      .select('id, brand_id, status, order_number, customer_name, customer_email, customer_phone, items, subtotal, tracking_number')
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
          customerPhone:  (order.customer_phone as string | null) ?? undefined,
        }),
      }).catch(console.error)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/orders')
  return { error: null }
}
