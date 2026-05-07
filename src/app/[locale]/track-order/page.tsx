import { StoreNavbar } from '@/components/layout/StoreNavbar';
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
  pending:    '#D97706',
  confirmed:  '#2563EB',
  fulfilling: '#2563EB',
  shipped:    '#0891B2',
  delivered:  '#059669',
  completed:  '#059669',
  cancelled:  '#DC2626',
  refunded:   '#6B5B4E',
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
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-start justify-center px-6">
        <div className="max-w-sm w-full py-16">

          <p
            className="text-[9px] tracking-[0.45em] uppercase mb-6"
            style={{ color: '#B8975A' }}
          >
            Merchant Club SA
          </p>
          <h1
            className="font-display text-3xl font-light mb-3 leading-tight"
            style={{ color: '#1A1208' }}
          >
            {isAr ? 'تتبع طلبك' : 'Track your order'}
          </h1>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: '#6B5B4E' }}>
            {isAr
              ? 'أدخل رقم الطلب ورقم الجوال المستخدم عند الطلب.'
              : 'Enter your order number and the phone number you used when ordering.'}
          </p>

          {/* Lookup form */}
          <form method="GET" className="flex flex-col gap-4 mb-8">
            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: '#6B5B4E' }}
              >
                {isAr ? 'رقم الطلب' : 'Order Number'}
              </label>
              <input
                name="order"
                type="text"
                required
                defaultValue={orderNumber ?? ''}
                placeholder="MCO-20260501-1234"
                className="w-full text-sm px-4 py-3 border border-[#E5DDD0] placeholder:text-[#6B5B4E]/40 focus:outline-none focus:border-[#B8975A] transition-colors font-mono tracking-wide"
                style={{ background: '#FFFFFF', color: '#1A1208' }}
                dir="ltr"
              />
            </div>
            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: '#6B5B4E' }}
              >
                {isAr ? 'رقم الجوال' : 'Phone Number'}
              </label>
              <input
                name="phone"
                type="tel"
                required
                defaultValue={phone ?? ''}
                placeholder="+966 5X XXX XXXX"
                className="w-full text-sm px-4 py-3 border border-[#E5DDD0] placeholder:text-[#6B5B4E]/40 focus:outline-none focus:border-[#B8975A] transition-colors"
                style={{ background: '#FFFFFF', color: '#1A1208' }}
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 transition-opacity hover:opacity-85 w-full mt-2"
              style={{
                background: '#3D2B1F',
                color: '#FFFFFF',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isAr ? 'بحث عن الطلب' : 'Find Order'}
            </button>
          </form>

          {/* Error */}
          {lookupAttempted && lookupError && (
            <div
              className="px-4 py-4 mb-6 rounded-lg"
              style={{ border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}
            >
              <p className="text-sm text-red-600">
                {isAr
                  ? 'لم يُعثر على طلب بهذه المعلومات. تحقق من رقم الطلب ورقم الجوال.'
                  : 'No order found. Please check your order number and phone number.'}
              </p>
            </div>
          )}

          {/* Order result */}
          {orderData && (
            <div
              className="p-6 space-y-4 rounded-xl"
              style={{ border: '1px solid #E5DDD0', background: '#FFFFFF' }}
            >
              <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: '#B8975A' }}>
                {isAr ? 'تفاصيل الطلب' : 'Order Details'}
              </p>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#6B5B4E' }}>
                  {isAr ? 'رقم الطلب' : 'Order'}
                </p>
                <p className="font-mono text-sm" style={{ color: '#1A1208' }}>
                  {orderData.order_number}
                </p>
              </div>

              <div className="h-px" style={{ background: '#E5DDD0' }} />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#6B5B4E' }}>
                  {isAr ? 'الاسم' : 'Name'}
                </p>
                <p className="text-sm" style={{ color: '#1A1208' }}>
                  {orderData.customer_name ?? '—'}
                </p>
              </div>

              <div className="h-px" style={{ background: '#E5DDD0' }} />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#6B5B4E' }}>
                  {isAr ? 'الإجمالي' : 'Total'}
                </p>
                <p className="text-sm font-bold" style={{ color: '#B8975A' }}>
                  {Number(orderData.subtotal).toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                </p>
              </div>

              {orderData.delivery_address?.city && (
                <>
                  <div className="h-px" style={{ background: '#E5DDD0' }} />
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#6B5B4E' }}>
                      {isAr ? 'المدينة' : 'City'}
                    </p>
                    <p className="text-sm" style={{ color: '#1A1208' }}>
                      {orderData.delivery_address.city}
                    </p>
                  </div>
                </>
              )}

              <div className="h-px" style={{ background: '#E5DDD0' }} />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#6B5B4E' }}>
                  {isAr ? 'الحالة' : 'Status'}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: STATUS_COLOR[currentStatus] ?? '#6B5B4E' }}
                >
                  {isAr
                    ? (STATUS_LABEL_AR[currentStatus] ?? currentStatus)
                    : (STATUS_LABEL_EN[currentStatus] ?? currentStatus)}
                </p>
              </div>
            </div>
          )}

          <p className="mt-8 text-[10px] text-center" style={{ color: '#6B5B4E' }}>
            {isAr ? 'تحتاج مساعدة؟ ' : 'Need help? '}
            <a
              href="mailto:info@merchantclubsa.com"
              className="transition-opacity hover:opacity-70"
              style={{ color: '#B8975A' }}
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
