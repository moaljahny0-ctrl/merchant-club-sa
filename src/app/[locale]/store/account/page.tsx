import { getCustomerSession } from '@/lib/customer-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { LogoutButton } from './LogoutButton';
import type { OrderStatus } from '@/lib/types/database';

type Props = { params: Promise<{ locale: string }> };

type OrderItem = { title?: string; quantity?: number };

type OrderRow = {
  id: string;
  order_number: string;
  items: unknown;
  subtotal: number;
  status: OrderStatus;
  created_at: string;
  customer_phone: string | null;
};

const statusColors: Record<string, string> = {
  pending:   '#B8975A',
  confirmed: '#4A7FB5',
  fulfilling:'#4A7FB5',
  shipped:   '#4A7FB5',
  delivered: '#4A9E6B',
  completed: '#4A9E6B',
  cancelled: '#CC5555',
  refunded:  '#9A6B4B',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';

  const session = await getCustomerSession();
  if (!session) redirect(`${prefix}/store/login`);

  const service = createServiceClient();

  let orders: OrderRow[] = [];
  if (session.phone) {
    const { data } = await service
      .from('orders')
      .select('id, order_number, items, subtotal, status, created_at, customer_phone')
      .or(`customer_user_id.eq.${session.id},customer_phone.eq.${session.phone}`)
      .order('created_at', { ascending: false });
    orders = (data ?? []) as OrderRow[];
  } else {
    const { data } = await service
      .from('orders')
      .select('id, order_number, items, subtotal, status, created_at, customer_phone')
      .eq('customer_user_id', session.id)
      .order('created_at', { ascending: false });
    orders = (data ?? []) as OrderRow[];
  }

  const firstName = session.full_name.split(' ')[0];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />

      <main style={{ flex: 1, maxWidth: '680px', margin: '0 auto', width: '100%', padding: '48px 24px 80px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ color: '#B8975A', fontSize: '12px', letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: '8px' }}>
            My Account
          </p>
          <h1 style={{ color: '#1A1208', fontSize: '28px', fontWeight: 400, lineHeight: 1.2 }}>
            مرحباً {firstName}.
          </h1>
        </div>

        {/* My Orders */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ color: '#1A1208', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 500 }}>
            My Orders
          </h2>

          {orders.length === 0 ? (
            <p style={{ color: '#6B5B4E', fontSize: '17px', lineHeight: 1.65 }}>
              {locale === 'ar' ? (
                <>لا يوجد طلبات بعد.{' '}
                  <a href="/store" style={{ color: '#B8975A', textDecoration: 'none' }}>ابدأ التسوق →</a>
                </>
              ) : (
                <>No orders yet.{' '}
                  <a href="/store" style={{ color: '#B8975A', textDecoration: 'none' }}>Start shopping →</a>
                </>
              )}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#E5DDD0' }}>
              {orders.map(order => {
                const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
                const productTitle = items[0]?.title ?? 'Order';
                const qty = items[0]?.quantity ?? 1;
                const phone = order.customer_phone ?? '';
                const trackUrl = `/track-order?order=${encodeURIComponent(order.order_number)}&phone=${encodeURIComponent(phone)}`;

                return (
                  <a
                    key={order.id}
                    href={trackUrl}
                    style={{
                      display: 'block',
                      background: '#FFFFFF',
                      padding: '18px 20px',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <p style={{ color: '#1A1208', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                          {productTitle}{qty > 1 ? ` × ${qty}` : ''}
                        </p>
                        <p style={{ color: '#6B5B4E', fontSize: '14px' }}>
                          #{order.order_number} · {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ color: '#1A1208', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                          SAR {order.subtotal.toFixed(2)}
                        </p>
                        <span style={{
                          fontSize: '12px',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: statusColors[order.status] ?? '#6B5B4E',
                          fontWeight: 500,
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* My Info */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ color: '#1A1208', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 500 }}>
            My Info
          </h2>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
            {[
              { label: 'Name',  value: session.full_name },
              { label: 'Phone', value: session.phone ?? '—' },
              { label: 'Email', value: session.email },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid #F0EAE0' : 'none',
                }}
              >
                <span style={{ color: '#6B5B4E', fontSize: '15px' }}>{label}</span>
                <span style={{ color: '#1A1208', fontSize: '15px' }}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Logout */}
        <LogoutButton />

      </main>

      <Footer />
    </div>
  );
}
