'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useCart } from '@/lib/cart/CartContext';
import { Button } from '@/components/ui/Button';

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
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B5B4E', marginRight: '16px' }}>
          {isAr ? 'الكمية' : 'Qty'}
        </span>
        <div style={{ display: 'flex', border: '1px solid #E5DDD0', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6B5B4E', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #E5DDD0' }}
          >
            −
          </button>
          <span style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', color: '#1A1208' }}>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(q => Math.min(max, q + 1))}
            style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6B5B4E', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #E5DDD0' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <Button
        onClick={handleAdd}
        variant="primary"
        fullWidth
        style={{
          background: added ? '#4A9E6B' : '#B8975A',
          color: '#FFFFFF',
          border: 'none',
        }}
      >
        {added
          ? (isAr ? '✓ تمت الإضافة' : '✓ Added to Cart')
          : (isAr ? 'أضف إلى السلة' : 'Add to Cart')}
      </Button>

      {/* View Cart link — appears after adding */}
      {added && (
        <Button
          onClick={openCart}
          variant="secondary"
          fullWidth
          style={{
            background: 'transparent',
            border: '1px solid #1A1208',
            color: '#1A1208',
          }}
        >
          {isAr ? 'عرض السلة' : 'View Cart'}
        </Button>
      )}
    </div>
  );
}
