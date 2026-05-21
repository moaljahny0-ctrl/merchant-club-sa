import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
};

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { order: orderParam } = await searchParams;
  const prefix = locale === 'ar' ? '/ar' : '';
  const ar = locale === 'ar';

  if (!orderParam) redirect(`${prefix}/store`);

  const orderNumbers = orderParam.split(',').map(s => s.trim()).filter(Boolean);
  const session = await getCustomerSession();

  // Fetch orders to show details
  const service = createServiceClient();
  const { data: orders } = await service
    .from('orders')
    .select('order_number, subtotal, customer_name, customer_phone')
    .in('order_number', orderNumbers);

  const firstName = orders?.[0]?.customer_name?.split(' ')[0] ?? '';
  const totalSubtotal = (orders ?? []).reduce((acc, o) => acc + Number(o.subtotal), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', padding: '48px 40px', textAlign: 'center' }}>

            {/* Gold checkmark */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#B8975A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Headline */}
            <p style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#B8975A', marginBottom: '8px' }}>
              {ar ? 'تم الطلب' : 'Order Placed'}
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 400, color: '#1A1208', marginBottom: '12px', lineHeight: 1.3 }}>
              {ar ? `شكراً لك${firstName ? '، ' + firstName : ''}.` : `Thank you${firstName ? ', ' + firstName : ''}.`}
            </h1>
            <p style={{ fontSize: '13px', color: '#6B5B4E', lineHeight: 1.65, marginBottom: '28px' }}>
              {ar
                ? 'تم استلام طلبك وسيتواصل معك المتجر قريباً لتأكيد الطلب.'
                : 'Your order has been received. The brand will contact you shortly to confirm.'}
            </p>

            {/* Order numbers */}
            <div style={{ background: '#F5F0E8', padding: '16px 20px', marginBottom: '28px' }}>
              {orderNumbers.map(num => (
                <p key={num} style={{ fontSize: '12px', color: '#1A1208', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  #{num}
                </p>
              ))}
              {totalSubtotal > 0 && (
                <p style={{ fontSize: '12px', color: '#6B5B4E', marginTop: '6px' }}>
                  {ar ? 'المجموع' : 'Total'}: {totalSubtotal.toFixed(2)} {ar ? 'ريال' : 'SAR'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orderNumbers.map(num => {
                const orderPhone = orders?.find(o => o.order_number === num)?.customer_phone ?? '';
                return (
                  <Link
                    key={num}
                    href={`/track-order?order=${encodeURIComponent(num)}&phone=${encodeURIComponent(orderPhone)}`}
                    style={{
                      display: 'block',
                      background: '#1A1208',
                      color: '#F5F0E8',
                      fontSize: '10px',
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      padding: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    {ar ? 'تتبع طلبك ←' : 'Track Your Order →'}
                    {orderNumbers.length > 1 ? ` #${num}` : ''}
                  </Link>
                );
              })}

              {session && (
                <Link
                  href="/store/account"
                  style={{
                    display: 'block',
                    border: '1px solid #E5DDD0',
                    color: '#1A1208',
                    fontSize: '10px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    padding: '14px',
                    textDecoration: 'none',
                  }}
                >
                  {ar ? 'حسابي ←' : 'View in My Account →'}
                </Link>
              )}

              <Link
                href="/store"
                style={{
                  display: 'block',
                  color: '#B8975A',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textDecoration: 'none',
                  padding: '8px',
                }}
              >
                {ar ? 'مواصلة التسوق ←' : 'Continue Shopping →'}
              </Link>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
