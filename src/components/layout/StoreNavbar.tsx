import { getCustomerSession } from '@/lib/customer-auth';
import { StoreNavbarClient } from './StoreNavbarClient';

export async function StoreNavbar() {
  const session = await getCustomerSession();
  const customer = session
    ? { initial: session.full_name.charAt(0).toUpperCase() }
    : null;
  return <StoreNavbarClient customer={customer} />;
}
