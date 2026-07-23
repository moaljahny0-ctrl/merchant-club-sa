'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/CartContext';

// Cart is only ever cleared here, once the customer has actually reached a
// confirmed order — not earlier in CheckoutForm. Card payments can take the
// browser away to Moyasar's 3DS challenge and back; clearing the cart before
// that round-trip completes would empty it even if the customer abandons or
// the payment is declined.
export function ClearCartOnMount() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
