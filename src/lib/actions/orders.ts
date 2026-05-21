'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  sendOrderEmail,
  buildOrderPlacedCustomerHtml,
  buildOrderPlacedBrandHtml,
  buildOrderPlacedAdminHtml,
  buildOrderStatusHtml,
  buildGuestInvitationHtml,
} from '@/lib/email'
import { getCustomerSession } from '@/lib/customer-auth'
import type { CartItem } from '@/lib/cart/CartContext'

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
    console.log('[email] Customer confirmation firing to:', email, '| order:', order.order_number)
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
    }).catch(err => console.error('[email] Customer confirmation failed:', err))
  }

  // Email D — guest account invitation (fire-and-forget, only for unregistered customers)
  if (email) {
    service
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
      .then(({ data: existingCustomer }) => {
        if (!existingCustomer) {
          sendOrderEmail({
            to: email,
            subject: 'أكمل تسجيلك في Merchant Club SA',
            html: buildGuestInvitationHtml({ customerName: name, orderNumber: order.order_number }),
          }).catch(err => console.error('[email] Guest invitation failed:', err))
        }
      })
  }

  // Email B — brand notification
  if (brand?.contact_email) {
    console.log('[email] Brand notification firing to:', brand.contact_email, '| order:', order.order_number)
    sendOrderEmail({
      to: brand.contact_email,
      subject: `New Order — #${order.order_number}`,
      html: buildOrderPlacedBrandHtml({
        brandName:     brand.name_en,
        orderNumber:   order.order_number,
        customerName:  name,
        customerPhone: phone,
        city,
        productTitle:  product.title_en,
        quantity,
        subtotal,
      }),
    }).catch(err => console.error('[email] Brand notification failed:', err))
  } else {
    console.warn('[email] Brand has no contact_email — skipping brand notification | brand_id:', brandId, '| brand:', JSON.stringify(brand))
  }

  // Email C — admin notification (always fires)
  console.log('[email] Admin notification firing | order:', order.order_number)
  sendOrderEmail({
    to: 'info@merchantclubsa.com',
    subject: `[Admin] New Order — #${order.order_number}`,
    html: buildOrderPlacedAdminHtml({
      orderNumber:   order.order_number,
      brandName:     brand?.name_en ?? 'Unknown Brand',
      customerName:  name,
      customerPhone: phone,
      customerEmail: email,
      city,
      productTitle:  product.title_en,
      quantity,
      subtotal,
    }),
  }).catch(err => console.error('[email] Admin notification failed:', err))

  const prefix = locale === 'ar' ? '/ar' : ''
  redirect(`${prefix}/brands/${slug}/products/${productId}/order/confirmation?id=${order.id}`)
}

export type PlaceOrderInput = {
  cartItems: CartItem[];
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerCity: string;
  customerAddress: string;
  notes: string | null;
};

export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ error: string | null; orderNumbers: string[] }> {
  const session = await getCustomerSession();
  const customerId = session?.id ?? null;

  const service = createServiceClient();

  // Group cart items by brand
  const brandGroups = new Map<string, CartItem[]>();
  for (const item of input.cartItems) {
    const group = brandGroups.get(item.brandId) ?? [];
    group.push(item);
    brandGroups.set(item.brandId, group);
  }

  const orderNumbers: string[] = [];

  for (const [brandId, items] of brandGroups) {
    // Fetch + validate all products in this brand group
    const productIds = items.map(i => i.productId);
    const { data: products } = await service
      .from('products')
      .select('id, title_en, price, sale_price, stock_quantity, brands(name_en, contact_email)')
      .in('id', productIds)
      .eq('status', 'live');

    if (!products || products.length !== items.length) {
      return { error: 'One or more products are no longer available.', orderNumbers: [] };
    }

    // Build validated order items
    const orderItems: Array<{ product_id: string; title: string; quantity: number; unit_price: number; total: number }> = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) return { error: 'Product not found.', orderNumbers: [] };

      const stock = product.stock_quantity ?? 0;
      if (stock < cartItem.quantity) {
        return {
          error: `Only ${stock} unit${stock === 1 ? '' : 's'} of "${product.title_en}" available.`,
          orderNumbers: [],
        };
      }

      const unitPrice = product.sale_price ? Number(product.sale_price) : Number(product.price);
      const total = unitPrice * cartItem.quantity;
      subtotal += total;

      orderItems.push({
        product_id: cartItem.productId,
        title: product.title_en,
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        total,
      });
    }

    const orderNumber = generateOrderNumber();

    const { data: order, error: insertError } = await service
      .from('orders')
      .insert({
        order_number: orderNumber,
        brand_id: brandId,
        customer_user_id: customerId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_email: input.customerEmail,
        delivery_address: { city: input.customerCity, address: input.customerAddress },
        items: orderItems,
        subtotal,
        status: 'pending',
        brand_notes: input.notes,
      })
      .select('id, order_number')
      .single();

    if (insertError || !order) {
      return { error: 'Failed to place order. Please try again.', orderNumbers: [] };
    }

    orderNumbers.push(order.order_number);

    // Decrement stock for each product (fire-and-forget)
    for (const cartItem of items) {
      const product = products.find(p => p.id === cartItem.productId)!;
      const newStock = Math.max(0, (product.stock_quantity ?? 0) - cartItem.quantity);
      const stockUpdate: Record<string, unknown> = { stock_quantity: newStock };
      if (newStock === 0) stockUpdate.status = 'out_of_stock';
      service.from('products').update(stockUpdate).eq('id', cartItem.productId)
        .then(({ error }) => { if (error) console.error('[stock] decrement failed:', error); });
    }

    const brand = (products[0].brands as unknown) as { name_en: string; contact_email: string | null } | null;
    const firstTitle = orderItems[0].title;
    const firstQty   = orderItems[0].quantity;
    const extraItems = orderItems.length > 1 ? ` +${orderItems.length - 1} more` : '';
    const displayTitle = `${firstTitle}${extraItems}`;

    // Customer email
    if (input.customerEmail) {
      sendOrderEmail({
        to: input.customerEmail,
        subject: `Order Confirmed — #${order.order_number}`,
        html: buildOrderPlacedCustomerHtml({
          customerName: input.customerName,
          orderNumber:  order.order_number,
          productTitle: displayTitle,
          quantity:     firstQty,
          unitPrice:    orderItems[0].unit_price,
          subtotal,
          city:         input.customerCity,
          address:      input.customerAddress,
        }),
      }).catch(err => console.error('[email] customer confirmation failed:', err));

      // Guest invitation (only if not registered)
      if (!customerId) {
        service.from('customers').select('id').eq('phone', input.customerPhone).maybeSingle()
          .then(({ data: existing }) => {
            if (!existing) {
              sendOrderEmail({
                to: input.customerEmail!,
                subject: 'أكمل تسجيلك في Merchant Club SA',
                html: buildGuestInvitationHtml({ customerName: input.customerName, orderNumber: order.order_number }),
              }).catch(err => console.error('[email] guest invitation failed:', err));
            }
          });
      }
    }

    // Brand email
    if (brand?.contact_email) {
      sendOrderEmail({
        to: brand.contact_email,
        subject: `New Order — #${order.order_number}`,
        html: buildOrderPlacedBrandHtml({
          brandName:     brand.name_en,
          orderNumber:   order.order_number,
          customerName:  input.customerName,
          customerPhone: input.customerPhone,
          city:          input.customerCity,
          productTitle:  displayTitle,
          quantity:      firstQty,
          subtotal,
        }),
      }).catch(err => console.error('[email] brand notification failed:', err));
    }

    // Admin email
    sendOrderEmail({
      to: 'info@merchantclubsa.com',
      subject: `[Admin] New Order — #${order.order_number}`,
      html: buildOrderPlacedAdminHtml({
        orderNumber:   order.order_number,
        brandName:     brand?.name_en ?? 'Unknown Brand',
        customerName:  input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        city:          input.customerCity,
        productTitle:  displayTitle,
        quantity:      firstQty,
        subtotal,
      }),
    }).catch(err => console.error('[email] admin notification failed:', err));
  }

  return { error: null, orderNumbers };
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
