import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createServiceClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string; phone?: string }>;
};

type OrderStatus =
  | 'pending' | 'confirmed' | 'fulfilling'
  | 'shipped' | 'delivered' | 'completed'
  | 'cancelled' | 'refunded'

const STATUS_LABEL_EN: Record<string, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  fulfilling: 'Preparing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  completed:  'Completed',
  cancelled:  'Cancelled',
  refunded:   'Refunded',
}

const STATUS_LABEL_AR: Record<string, string> = {
  pending:    'قيد المعالجة',
  confirmed:  'مؤكد',
  fulfilling: 'جاري التجهيز',
  shipped:    'تم الشحن',
  delivered:  'تم التوصيل',
  completed:  'مكتمل',
  cancelled:  'ملغى',
  refunded:   'مسترجع',
}

const STATUS_COLOR: Record<string, string> = {
  pending:    'text-amber-400',
  confirmed:  'text-blue-400',
  fulfilling: 'text-blue-400',
  shipped:    'text-cyan-400',
  delivered:  'text-emerald-400',
  completed:  'text-emerald-400',
  cancelled:  'text-red-400',
  refunded:   'text-muted',
}

export default async function TrackOrderPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { order: orderNumber, phone } = await searchParams;
  const isAr = locale === 'ar';

  type OrderRow = {
    id: string
    order_number: string
    customer_name: string | null
    subtotal: number
    status: OrderStatus
    fulfillment_status: string | null
    created_at: string
    delivery_address: { city?: string; address?: string } | null
  }

  let orderData: OrderRow | null = null;
  let lookupAttempted = false;
  let lookupError = false;

  if (orderNumber && phone) {
    lookupAttempted = true;
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, subtotal, status, fulfillment_status, created_at, delivery_address')
      .eq('order_number', orderNumber.trim().toUpperCase())
      .eq('customer_phone', phone.trim())
      .single();

    if (data) {
      orderData = data as OrderRow;
    } else {
      lookupError = true;
    }
  }

  const currentStatus = orderData?.fulfillment_status ?? orderData?.status ?? 'pending';

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16 flex items-start justify-center px-6">
        <div className="max-w-sm w-full py-20">

          <p className="text-[9px] text-gold tracking-[0.45em] uppercase mb-6">
            Merchant Club SA
          </p>
          <h1 className="font-display text-3xl font-light text-parchment mb-3 leading-tight">
            {isAr ? 'تتبع طلبك' : 'Track your order'}
          </h1>
          <p className="text-muted text-sm mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {isAr
              ? 'أدخل رقم الطلب ورقم الجوال المستخدم عند الطلب.'
              : 'Enter your order number and the phone number you used when ordering.'}
          </p>

          {/* Lookup form */}
          <form method="GET" className="flex flex-col gap-4 mb-8">
            <div>
              <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
                {isAr ? 'رقم الطلب' : 'Order Number'}
              </label>
              <input
                name="order"
                type="text"
                required
                defaultValue={orderNumber ?? ''}
                placeholder="MCO-20260501-1234"
                className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors font-mono tracking-wide"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
                {isAr ? 'رقم الجوال' : 'Phone Number'}
              </label>
              <input
                name="phone"
                type="tel"
                required
                defaultValue={phone ?? ''}
                placeholder="+966 5X XXX XXXX"
                className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors w-full mt-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {isAr ? 'بحث عن الطلب' : 'Find Order'}
            </button>
          </form>

          {/* Error */}
          {lookupAttempted && lookupError && (
            <div className="border border-red-400/30 bg-red-400/5 px-4 py-4 mb-6">
              <p className="text-red-400 text-sm">
                {isAr
                  ? 'لم يُعثر على طلب بهذه المعلومات. تحقق من رقم الطلب ورقم الجوال.'
                  : 'No order found. Please check your order number and phone number.'}
              </p>
            </div>
          )}

          {/* Order result */}
          {orderData && (
            <div className="border border-border bg-surface p-6 space-y-4">
              <p className="text-[10px] text-gold tracking-[0.35em] uppercase">
                {isAr ? 'تفاصيل الطلب' : 'Order Details'}
              </p>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
                  {isAr ? 'رقم الطلب' : 'Order'}
                </p>
                <p className="text-parchment font-mono text-sm">{orderData.order_number}</p>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
                  {isAr ? 'الاسم' : 'Name'}
                </p>
                <p className="text-parchment text-sm">{orderData.customer_name ?? '—'}</p>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
                  {isAr ? 'الإجمالي' : 'Total'}
                </p>
                <p className="text-gold text-sm">SAR {Number(orderData.subtotal).toFixed(2)}</p>
              </div>

              {orderData.delivery_address?.city && (
                <>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
                      {isAr ? 'المدينة' : 'City'}
                    </p>
                    <p className="text-parchment text-sm">{orderData.delivery_address.city}</p>
                  </div>
                </>
              )}

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
                  {isAr ? 'الحالة' : 'Status'}
                </p>
                <p className={`text-sm font-medium ${STATUS_COLOR[currentStatus] ?? 'text-muted'}`}>
                  {isAr
                    ? (STATUS_LABEL_AR[currentStatus] ?? currentStatus)
                    : (STATUS_LABEL_EN[currentStatus] ?? currentStatus)}
                </p>
              </div>
            </div>
          )}

          <p className="mt-8 text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {isAr ? 'تحتاج مساعدة؟ ' : 'Need help? '}
            <a
              href="mailto:info@merchantclubsa.com"
              className="text-gold/60 hover:text-gold transition-colors"
            >
              info@merchantclubsa.com
            </a>
          </p>

        </div>
      </main>
      <Footer />
    </div>
  );
}
