'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useCart, type CartItem } from '@/lib/cart/CartContext';
import { Button } from '@/components/ui/Button';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, count } = useCart();
  const locale = useLocale();
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,18,8,0.45)',
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          [isAr ? 'left' : 'right']: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100dvh',
          background: '#FFFFFF',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isAr ? '4px 0 32px rgba(0,0,0,0.12)' : '-4px 0 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #E5DDD0',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B8975A', marginBottom: '2px' }}>
              {isAr ? 'سلة المشتريات' : 'Your Cart'}
            </p>
            <p style={{ fontSize: '14px', color: '#6B5B4E' }}>
              {count} {isAr ? (count === 1 ? 'منتج' : 'منتجات') : (count === 1 ? 'item' : 'items')}
            </p>
          </div>
          <button
            onClick={closeCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B5B4E', fontSize: '16px', lineHeight: 1, borderRadius: '8px' }}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ color: '#6B5B4E', fontSize: '17px', marginBottom: '20px' }}>
                {isAr ? 'السلة فارغة' : 'Your cart is empty'}
              </p>
              <Button href="/store" onClick={closeCart} variant="back" style={{ color: '#B8975A' }}>
                {isAr ? 'ابدأ التسوق ←' : 'Start Shopping →'}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map(item => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  isAr={isAr}
                  onRemove={removeItem}
                  onQty={updateQuantity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #E5DDD0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: '#6B5B4E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isAr ? 'المجموع' : 'Subtotal'}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#1A1208' }}>
                {subtotal.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
              </span>
            </div>
            <Button
              href="/store/checkout"
              onClick={closeCart}
              variant="primary"
              fullWidth
              className="mb-2.5"
              style={{ background: '#1A1208', color: '#F5F0E8' }}
            >
              {isAr ? 'متابعة الطلب' : 'Proceed to Checkout'}
            </Button>
            <Button
              onClick={closeCart}
              variant="back"
              fullWidth
              className="border-0"
              style={{ color: '#6B5B4E' }}
            >
              {isAr ? 'مواصلة التسوق' : 'Continue Shopping'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItemRow({
  item, isAr, onRemove, onQty,
}: {
  item: CartItem;
  isAr: boolean;
  onRemove: (id: string) => void;
  onQty: (id: string, qty: number) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {/* Thumbnail */}
      <div style={{
        width: '68px',
        height: '86px',
        flexShrink: 0,
        background: '#F0EBE1',
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {item.image_url ? (
          <Image src={item.image_url} alt={item.productName} fill className="object-cover object-top" sizes="68px" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '20px', height: '1px', background: '#E5DDD0' }} />
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', color: '#B8975A', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>
          {item.brandName}
        </p>
        <p style={{ fontSize: '16px', color: '#1A1208', marginBottom: '4px', lineHeight: 1.3 }}>
          {item.productName}
        </p>
        <p style={{ fontSize: '16px', color: '#B8975A', fontWeight: 500, marginBottom: '10px' }}>
          {(item.price * item.quantity).toFixed(2)} {isAr ? 'ريال' : 'SAR'}
        </p>

        {/* Qty + remove */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onQty(item.productId, item.quantity - 1)}
            style={{ width: '36px', height: '36px', border: '1px solid #E5DDD0', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B5B4E', flexShrink: 0 }}
          >
            −
          </button>
          <span style={{ fontSize: '16px', minWidth: '22px', textAlign: 'center', color: '#1A1208' }}>
            {item.quantity}
          </span>
          <button
            onClick={() => onQty(item.productId, item.quantity + 1)}
            style={{ width: '36px', height: '36px', border: '1px solid #E5DDD0', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B5B4E', flexShrink: 0 }}
          >
            +
          </button>
          <button
            onClick={() => onRemove(item.productId)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#CC5555', padding: '8px', minHeight: '36px', letterSpacing: '0.02em' }}
          >
            {isAr ? 'حذف' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
