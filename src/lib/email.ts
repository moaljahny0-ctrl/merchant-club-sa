import { Resend } from 'resend'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e0;max-width:600px;width:100%;">

        <tr>
          <td style="padding:28px 40px 22px;border-bottom:1px solid #efefed;text-align:center;">
            <img src="${SITE_URL}/logo.png" alt="Merchant Club SA" width="36" height="36"
                 style="display:block;margin:0 auto 10px;border-radius:50%;" />
            <p style="margin:0;font-size:9px;letter-spacing:0.38em;text-transform:uppercase;color:#b8975a;">
              Merchant Club SA
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <tr>
          <td style="padding:18px 40px;border-top:1px solid #efefed;text-align:center;">
            <p style="margin:0;font-size:11px;color:#aaaaaa;">
              <a href="${SITE_URL}" style="color:#b8975a;text-decoration:none;">merchantclubsa.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function row(label: string, value: string, last = false): string {
  const border = last ? '' : 'border-bottom:1px solid #f4f4f2;'
  return `<tr>
    <td style="padding:10px 0;font-size:13px;color:#888888;${border}">${label}</td>
    <td style="padding:10px 0;font-size:13px;color:#1a1a1a;text-align:right;${border}">${value}</td>
  </tr>`
}

// ── Public send helper ────────────────────────────────────────────────────────

export async function sendOrderEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping to', params.to)
    return
  }
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'Merchant Club SA <orders@merchantclubsa.com>',
    to:   [params.to],
    subject: params.subject,
    html: params.html,
  })
  if (error) throw new Error(typeof error === 'object' ? JSON.stringify(error) : String(error))
}

// ── Template builders ─────────────────────────────────────────────────────────

export function buildOrderPlacedCustomerHtml(params: {
  customerName: string
  orderNumber: string
  productTitle: string
  quantity: number
  unitPrice: number
  subtotal: number
  city: string
  address: string
}): string {
  const { customerName, orderNumber, productTitle, quantity, unitPrice, subtotal, city, address } = params
  return shell(`
    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:#b8975a;">Order Received</p>
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:400;color:#1a1a1a;letter-spacing:-0.01em;">
      Thank you, ${esc(customerName)}.
    </h1>
    <p style="margin:0 0 32px;font-size:14px;color:#666666;line-height:1.65;">
      Your order has been received and is being processed.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efefed;margin-bottom:28px;">
      ${row('Order', '#' + esc(orderNumber))}
      ${row('Product', `${esc(productTitle)} &times; ${quantity}`)}
      ${row('Unit price', `SAR ${unitPrice.toFixed(2)}`)}
      ${row('Total', `<strong>SAR ${subtotal.toFixed(2)}</strong>`, true)}
    </table>

    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#aaaaaa;">Delivery address</p>
    <p style="margin:0 0 32px;font-size:13px;color:#555555;line-height:1.6;">
      ${esc(address)}, ${esc(city)}
    </p>

    <p style="margin:0;font-size:13px;color:#999999;line-height:1.6;">
      We&rsquo;ll notify you when your order ships.
    </p>
  `)
}

export function buildOrderPlacedBrandHtml(params: {
  brandName: string
  orderNumber: string
  customerName: string
  customerPhone: string
  city: string
  productTitle: string
  quantity: number
  subtotal: number
}): string {
  const { brandName, orderNumber, customerName, customerPhone, city, productTitle, quantity, subtotal } = params
  const dashboardUrl = `${SITE_URL}/dashboard/brand/orders`
  return shell(`
    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:#b8975a;">New Order</p>
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:400;color:#1a1a1a;letter-spacing:-0.01em;">
      You have a new order.
    </h1>
    <p style="margin:0 0 32px;font-size:14px;color:#666666;line-height:1.65;">
      A new order has been placed on <strong style="color:#1a1a1a;">${esc(brandName)}</strong> via Merchant Club SA.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efefed;margin-bottom:28px;">
      ${row('Order', '#' + esc(orderNumber))}
      ${row('Customer', esc(customerName))}
      ${row('Phone', esc(customerPhone))}
      ${row('City', esc(city))}
      ${row('Product', `${esc(productTitle)} &times; ${quantity}`)}
      ${row('Total', `<strong>SAR ${subtotal.toFixed(2)}</strong>`, true)}
    </table>

    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:#b8975a;">
        <a href="${esc(dashboardUrl)}"
           style="display:inline-block;padding:14px 32px;font-size:11px;font-family:Georgia,serif;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
          Manage this order &rarr;
        </a>
      </td></tr>
    </table>
  `)
}

type StatusEmailStatus = 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export function buildOrderStatusHtml(params: {
  customerName: string
  orderNumber: string
  productTitle: string
  subtotal: number
  status: StatusEmailStatus
  trackingNumber?: string
}): string {
  const { customerName, orderNumber, productTitle, subtotal, status, trackingNumber } = params

  const headlines: Record<StatusEmailStatus, string> = {
    confirmed: 'Your order is confirmed.',
    shipped:   'Your order is on its way.',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
  }

  const bodies: Record<StatusEmailStatus, string> = {
    confirmed: 'Your order has been confirmed and is being prepared for shipment.',
    shipped:   'Your order has shipped and is on its way to you.',
    delivered: 'Your order has been delivered. We hope you enjoy your purchase.',
    cancelled: 'Unfortunately your order has been cancelled. If you have any questions please contact us at <a href="mailto:info@merchantclubsa.com" style="color:#b8975a;text-decoration:none;">info@merchantclubsa.com</a>.',
  }

  const accents: Record<StatusEmailStatus, string> = {
    confirmed: '#b8975a',
    shipped:   '#b8975a',
    delivered: '#4a9e6b',
    cancelled: '#cc5555',
  }

  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return shell(`
    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:${accents[status]};">
      Order ${esc(label)}
    </p>
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:400;color:#1a1a1a;letter-spacing:-0.01em;">
      ${headlines[status]}
    </h1>
    <p style="margin:0 0 32px;font-size:14px;color:#666666;line-height:1.65;">
      Hi ${esc(customerName)}, ${bodies[status]}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efefed;margin-bottom:28px;">
      ${row('Order', '#' + esc(orderNumber))}
      ${row('Product', esc(productTitle))}
      ${trackingNumber ? row('Tracking number', `<span style="font-family:monospace;">${esc(trackingNumber)}</span>`) : ''}
      ${row('Total', `<strong>SAR ${subtotal.toFixed(2)}</strong>`, true)}
    </table>
  `)
}
