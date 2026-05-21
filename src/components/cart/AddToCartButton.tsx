'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useCart } from '@/lib/cart/CartContext';

type Props = {
  productId: string;
  brandId: string;
  brandSlug: string;
  productName: string;
  brandName: string;
  price: number;
  image_url: string | null;
  maxQty: number;
};

export function AddToCartButton({
  productId, brandId, brandSlug, productName, brandName, price, image_url, maxQty,
}: Props) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const max = Math.min(maxQty, 10);

  function handleAdd() {
    addItem({ productId, brandId, brandSlug, productName, brandName, price, image_url, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Quantity selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        <span style={{ fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6B5B4E', marginRight: '16px' }}>
          {isAr ? 'الكمية' : 'Qty'}
        </span>
        <div style={{ display: 'flex', border: '1px solid #E5DDD0' }}>
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            style={{ width: '36px', height: '36px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6B5B4E', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #E5DDD0' }}
          >
            −
          </button>
          <span style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#1A1208' }}>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(q => Math.min(max, q + 1))}
            style={{ width: '36px', height: '36px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6B5B4E', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #E5DDD0' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAdd}
        style={{
          width: '100%',
          background: added ? '#4A9E6B' : '#B8975A',
          color: '#FFFFFF',
          fontSize: '10px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          padding: '16px',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
      >
        {added
          ? (isAr ? '✓ تمت الإضافة' : '✓ Added to Cart')
          : (isAr ? 'أضف إلى السلة' : 'Add to Cart')}
      </button>

      {/* View Cart link — appears after adding */}
      {added && (
        <button
          onClick={openCart}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid #1A1208',
            color: '#1A1208',
            fontSize: '10px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            padding: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {isAr ? 'عرض السلة' : 'View Cart'}
        </button>
      )}
    </div>
  );
}
