'use client';

import Image from 'next/image';
import { useCart } from '@/lib/cart/CartContext';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Button } from '@/components/ui/Button';

type Props = {
  locale: string;
};

export function CartPageClient({ locale }: Props) {
  const { items, removeItem, updateQuantity, subtotal, count } = useCart();
  const isAr = locale === 'ar';

  return (
    <div className="px-6 md:px-10 py-10 md:py-14">
      <div className="max-w-6xl mx-auto">
        <p className="text-[12px] tracking-[0.35em] uppercase mb-2" style={{ color: '#B8975A' }}>
          {isAr ? 'سلة المشتريات' : 'Your Cart'}
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-light mb-8" style={{ color: '#1A1208' }}>
          {count > 0
            ? (isAr ? `${count} ${count === 1 ? 'منتج' : 'منتجات'}` : `${count} ${count === 1 ? 'item' : 'items'}`)
            : (isAr ? 'السلة فارغة' : 'Your cart is empty')}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base mb-6" style={{ color: '#6B5B4E' }}>
              {isAr ? 'لم تُضف أي منتجات بعد.' : 'You haven’t added anything yet.'}
            </p>
            <Button href="/store" variant="primary" style={{ background: '#1A1208', color: '#F5F0E8' }}>
              {isAr ? 'ابدأ التسوق ←' : 'Start Shopping →'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
            {/* Line items */}
            <div className="divide-y" style={{ borderTop: '1px solid #E5DDD0', borderBottom: '1px solid #E5DDD0' }}>
              {items.map(item => (
                <div key={item.productId} className="flex gap-4 py-5" style={{ borderColor: '#E5DDD0' }}>
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden" style={{ background: '#F0EBE1' }}>
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.productName} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-px w-8" style={{ background: '#E5DDD0' }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-[12px] uppercase tracking-wide" style={{ color: '#B8975A' }}>{item.brandName}</p>
                      <p className="text-sm font-medium" style={{ color: '#1A1208' }}>{item.productName}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={qty => updateQuantity(item.productId, qty)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={isAr ? 'إزالة' : 'Remove item'}
                        className="text-[13px] transition-colors"
                        style={{ color: '#CC5555' }}
                      >
                        {isAr ? 'حذف' : 'Remove'}
                      </button>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-semibold" style={{ color: '#1A1208' }}>
                    {(item.price * item.quantity).toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                  </p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="h-fit rounded-2xl p-6" style={{ border: '1px solid #E5DDD0', background: '#FFFFFF' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1A1208' }}>
                {isAr ? 'ملخص الطلب' : 'Order Summary'}
              </h2>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between" style={{ color: '#6B5B4E' }}>
                  <dt>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</dt>
                  <dd>{subtotal.toFixed(2)} {isAr ? 'ريال' : 'SAR'}</dd>
                </div>
                <p className="text-[12px]" style={{ color: '#6B5B4E' }}>
                  {isAr ? 'الشحن يُحسب عند الدفع' : 'Shipping calculated at checkout'}
                </p>
              </dl>

              <Button
                href="/store/checkout"
                variant="primary"
                fullWidth
                className="mt-6"
                style={{ background: '#1A1208', color: '#F5F0E8' }}
              >
                {isAr ? 'متابعة الطلب' : 'Proceed to Checkout'}
              </Button>
              <Button
                href="/store"
                variant="back"
                fullWidth
                className="mt-2.5 border-0"
                style={{ color: '#6B5B4E' }}
              >
                {isAr ? 'مواصلة التسوق' : 'Continue Shopping'}
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
