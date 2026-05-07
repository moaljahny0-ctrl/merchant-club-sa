import { notFound } from 'next/navigation'
import { StoreNavbar } from '@/components/layout/StoreNavbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import { createServiceClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string; slug: string; id: string }>
  searchParams: Promise<{ id?: string }>
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  const { id: orderId } = await searchParams
  const isAr = locale === 'ar'

  if (!orderId) notFound()

  const supabase = createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, subtotal, status, created_at, delivery_address')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  const address = order.delivery_address as { city?: string; address?: string } | null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm w-full py-16">

          {/* Check mark */}
          <div className="flex justify-center mb-8">
            <div
              className="w-12 h-12 flex items-center justify-center rounded-full"
              style={{ border: '1px solid rgba(184,151,90,0.5)', background: 'rgba(184,151,90,0.06)' }}
            >
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path
                  d="M1 8L7 14L19 1"
                  stroke="#B8975A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <p
            className="text-[10px] tracking-[0.35em] uppercase mb-4 text-center"
            style={{ color: '#B8975A' }}
          >
            {isAr ? 'تم تأكيد الطلب' : 'Order Confirmed'}
          </p>

          <h1
            className="font-display text-3xl font-light text-center mb-2"
            style={{ color: '#1A1208' }}
          >
            {isAr ? 'شكراً لك' : 'Thank you'}
            {order.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}
          </h1>

          <p className="text-sm text-center leading-relaxed mb-10" style={{ color: '#6B5B4E' }}>
            {isAr
              ? 'استلمنا طلبك وسيتواصل معك المتجر قريباً.'
              : 'Your order has been received. The brand will contact you shortly.'}
          </p>

          {/* Order card */}
          <div
            className="p-6 space-y-4 mb-10 rounded-xl"
            style={{ border: '1px solid #E5DDD0', background: '#FFFFFF' }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6B5B4E' }}>
                {isAr ? 'رقم الطلب' : 'Order Number'}
              </p>
              <p className="font-mono text-sm" style={{ color: '#1A1208' }}>
                {order.order_number}
              </p>
            </div>

            <div className="h-px" style={{ background: '#E5DDD0' }} />

            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6B5B4E' }}>
                {isAr ? 'الإجمالي' : 'Total'}
              </p>
              <p className="text-sm font-bold" style={{ color: '#B8975A' }}>
                {Number(order.subtotal).toFixed(2)} {isAr ? 'ريال' : 'SAR'}
              </p>
            </div>

            {address?.city && (
              <>
                <div className="h-px" style={{ background: '#E5DDD0' }} />
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6B5B4E' }}>
                    {isAr ? 'المدينة' : 'City'}
                  </p>
                  <p className="text-sm" style={{ color: '#1A1208' }}>{address.city}</p>
                </div>
              </>
            )}

            <div className="h-px" style={{ background: '#E5DDD0' }} />

            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6B5B4E' }}>
                {isAr ? 'الحالة' : 'Status'}
              </p>
              <p className="text-xs uppercase tracking-wider text-emerald-600">
                {isAr ? 'قيد المعالجة' : 'Pending'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/store"
              className="inline-flex items-center justify-center text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 transition-opacity hover:opacity-85 w-full"
              style={{
                background: '#3D2B1F',
                color: '#FFFFFF',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isAr ? 'تسوّق المزيد' : 'Continue Shopping'}
            </Link>
            <Link
              href="/track-order"
              className="inline-flex items-center justify-center text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 transition-colors hover:border-[#B8975A] hover:text-[#B8975A] w-full"
              style={{
                border: '1px solid #E5DDD0',
                color: '#6B5B4E',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isAr ? 'تتبع طلبك' : 'Track your order'}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60 w-full py-2"
              style={{ color: '#6B5B4E' }}
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
