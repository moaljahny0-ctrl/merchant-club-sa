import { getCustomerSession } from '@/lib/customer-auth';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { CheckoutForm } from './CheckoutForm';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment_error?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { payment_error } = await searchParams;
  const session = await getCustomerSession();

  const customer = session
    ? { name: session.full_name, phone: session.phone ?? '', email: session.email }
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1">
        <CheckoutForm locale={locale} customer={customer} paymentError={payment_error ?? null} />
      </main>
      <Footer />
    </div>
  );
}
