import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
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
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16 flex items-center justify-center px-6">
        <div className="max-w-sm w-full py-20">

          {/* Gold check mark */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 border border-gold/40 flex items-center justify-center">
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path d="M1 8L7 14L19 1" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-4 text-center">
            {isAr ? 'تم تأكيد الطلب' : 'Order Confirmed'}
          </p>

          <h1 className="font-display text-3xl font-light text-parchment text-center mb-2">
            {isAr ? 'شكراً لك' : 'Thank you'}
            {order.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}
          </h1>

          <p className="text-muted text-sm text-center leading-relaxed mb-10">
            {isAr
              ? 'استلمنا طلبك وسيتواصل معك المتجر قريباً.'
              : 'Your order has been received. The brand will contact you shortly.'}
          </p>

          {/* Order card */}
          <div className="border border-border bg-surface p-6 space-y-4 mb-10">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] text-muted tracking-[0.2em] uppercase">
                {isAr ? 'رقم الطلب' : 'Order Number'}
              </p>
              <p className="text-parchment font-mono text-sm">{order.order_number}</p>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] text-muted tracking-[0.2em] uppercase">
                {isAr ? 'الإجمالي' : 'Total'}
              </p>
              <p className="text-gold text-sm">SAR {Number(order.subtotal).toFixed(2)}</p>
            </div>

            {address?.city && (
              <>
                <div className="h-px bg-border" />
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[10px] text-muted tracking-[0.2em] uppercase">
                    {isAr ? 'المدينة' : 'City'}
                  </p>
                  <p className="text-parchment text-sm">{address.city}</p>
                </div>
              </>
            )}

            <div className="h-px bg-border" />

            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] text-muted tracking-[0.2em] uppercase">
                {isAr ? 'الحالة' : 'Status'}
              </p>
              <p className="text-emerald-400 text-xs uppercase tracking-wider">
                {isAr ? 'قيد المعالجة' : 'Pending'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/brands/${slug}`}
              className="inline-flex items-center justify-center border border-border text-parchment text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors w-full"
            >
              {isAr ? 'العودة للمتجر' : 'Back to Store'}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-muted hover:text-gold text-[10px] tracking-[0.2em] uppercase transition-colors w-full py-2"
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
