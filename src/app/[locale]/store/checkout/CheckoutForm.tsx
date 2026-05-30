'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/lib/cart/CartContext';
import { placeOrder } from '@/lib/actions/orders';
import { Link } from '@/i18n/navigation';

const PROMO_CODE = 'MERCHANT2026';

const SAUDI_CITIES_AR = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف', 'تبوك', 'بريدة', 'أبها', 'خميس مشيط', 'نجران', 'حائل', 'جازان', 'ينبع', 'القطيف', 'الأحساء', 'الجبيل', 'عرعر', 'سكاكا'];
const SAUDI_CITIES_EN = ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Tabuk', 'Buraidah', 'Abha', 'Khamis Mushait', 'Najran', 'Hail', 'Jazan', 'Yanbu', 'Qatif', 'Al-Ahsa', 'Jubail', 'Arar', 'Sakaka'];

function isValidSaudiPhone(p: string): boolean {
  const cleaned = p.replace(/[\s\-()]/g, '');
  return /^(05\d{8}|\+9665\d{8}|009665\d{8})$/.test(cleaned);
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '9px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#6B5B4E',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5DDD0',
  background: '#FFFFFF',
  color: '#1A1208',
  fontSize: '14px',
  padding: '12px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

type Customer = { name: string; phone: string; email: string } | null;
type Props = { locale: string; customer: Customer };

export function CheckoutForm({ locale, customer }: Props) {
  const ar = locale === 'ar';
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name,    setName]    = useState(customer?.name    ?? '');
  const [phone,   setPhone]   = useState(customer?.phone   ?? '');
  const [email,   setEmail]   = useState(customer?.email   ?? '');
  const [address, setAddress] = useState('');
  const [city,    setCity]    = useState('');
  const [notes,   setNotes]   = useState('');

  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  function handlePromo() {
    if (promoInput.trim().toUpperCase() === PROMO_CODE) {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError(ar ? 'رمز الخصم غير صالح.' : 'Invalid promo code.');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError(null);

    if (!isValidSaudiPhone(phone)) {
      setPhoneError(ar ? 'أدخل رقم جوال سعودي صحيح (مثال: 0512345678)' : 'Enter a valid Saudi mobile number (e.g. 0512345678)');
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        cartItems: items,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || null,
        customerCity: city.trim(),
        customerAddress: address.trim(),
        notes: notes.trim() || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      clearCart();
      const orderParam = result.orderNumbers.join(',');
      router.push(`/store/order-confirmation?order=${encodeURIComponent(orderParam)}`);
    });
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: '#6B5B4E', fontSize: '14px', marginBottom: '24px' }}>
          {ar ? 'السلة فارغة.' : 'Your cart is empty.'}
        </p>
        <Link href="/store" style={{ color: '#B8975A', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
          {ar ? 'تصفح المنتجات →' : 'Browse products →'}
        </Link>
      </div>
    );
  }

  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="max-w-5xl mx-auto px-4 py-10 md:py-16"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}
      >
        {/* Page title */}
        <div>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-60 mb-5"
            style={{ color: '#6B5B4E', textDecoration: 'none', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            <span>←</span>
            <span>{ar ? 'العودة للمتجر' : 'Back to Store'}</span>
          </Link>
          <p style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#B8975A', marginBottom: '6px' }}>
            {ar ? 'إتمام الطلب' : 'Checkout'}
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 400, color: '#1A1208' }}>
            {ar ? 'تفاصيل طلبك' : 'Your Order'}
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="md:grid-cols-[3fr_2fr]">

          {/* ── LEFT: Order Summary ── */}
          <div style={{ order: 2 }} className="md:order-1">
            <h2 style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A1208', marginBottom: '20px', fontWeight: 500 }}>
              {ar ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', marginBottom: '16px' }}>
              {items.map((item, i) => (
                <div
                  key={item.productId}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '16px 20px',
                    borderBottom: i < items.length - 1 ? '1px solid #F0EAE0' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: '56px', height: '70px', flexShrink: 0, background: '#F0EBE1', position: 'relative', overflow: 'hidden' }}>
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.productName} fill className="object-cover object-top" sizes="56px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '16px', height: '1px', background: '#E5DDD0' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '9px', color: '#B8975A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '3px' }}>
                      {item.brandName}
                    </p>
                    <p style={{ fontSize: '13px', color: '#1A1208', marginBottom: '4px' }}>
                      {item.productName}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6B5B4E' }}>
                      {ar ? 'الكمية' : 'Qty'}: {item.quantity}
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#1A1208', fontWeight: 500, flexShrink: 0 }}>
                    {(item.price * item.quantity).toFixed(2)} {ar ? 'ريال' : 'SAR'}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', padding: '16px 20px' }}>
              {[
                { label: ar ? 'المجموع الفرعي' : 'Subtotal',  value: `${subtotal.toFixed(2)} ${ar ? 'ريال' : 'SAR'}` },
                { label: ar ? 'الشحن' : 'Shipping',            value: promoApplied ? (ar ? 'مجانًا ✓' : 'Free ✓') : (ar ? 'مجانًا' : 'Free') },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #F0EAE0' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#6B5B4E' }}>{label}</span>
                  <span style={{ fontSize: '12px', color: promoApplied && label.includes('Shipping') || promoApplied && label.includes('الشحن') ? '#4A9E6B' : '#1A1208' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '4px', borderTop: '1px solid #E5DDD0' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1208' }}>{ar ? 'الإجمالي' : 'Total'}</span>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#B8975A' }}>
                  {total.toFixed(2)} {ar ? 'ريال' : 'SAR'}
                </span>
              </div>
            </div>

            {/* Promo code */}
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>{ar ? 'رمز الخصم' : 'Promo Code'}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                  placeholder={ar ? 'أدخل الرمز' : 'Enter code'}
                  style={{ ...inputStyle, flex: 1 }}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handlePromo}
                  disabled={promoApplied}
                  style={{
                    padding: '12px 20px',
                    background: promoApplied ? '#4A9E6B' : '#1A1208',
                    color: '#F5F0E8',
                    border: 'none',
                    cursor: promoApplied ? 'default' : 'pointer',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  {promoApplied ? '✓' : (ar ? 'تطبيق' : 'Apply')}
                </button>
              </div>
              {promoApplied && (
                <p style={{ fontSize: '11px', color: '#4A9E6B', marginTop: '6px' }}>
                  {ar ? '✓ شحن مجاني مطبّق' : '✓ Free shipping applied'}
                </p>
              )}
              {promoError && (
                <p style={{ fontSize: '11px', color: '#CC5555', marginTop: '6px' }}>{promoError}</p>
              )}
            </div>
          </div>

          {/* ── RIGHT: Customer Info ── */}
          <div style={{ order: 1 }} className="md:order-2">
            <h2 style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A1208', marginBottom: '20px', fontWeight: 500 }}>
              {ar ? 'بيانات التوصيل' : 'Delivery Details'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{ar ? 'الاسم الكامل' : 'Full Name'} *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoComplete="name" />
              </div>

              <div>
                <label style={labelStyle}>{ar ? 'رقم الجوال' : 'Phone'} *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                  onBlur={() => {
                    if (phone && !isValidSaudiPhone(phone)) {
                      setPhoneError(ar ? 'أدخل رقم جوال سعودي صحيح (مثال: 0512345678)' : 'Enter a valid Saudi mobile number (e.g. 0512345678)');
                    }
                  }}
                  placeholder="05XXXXXXXX"
                  style={{ ...inputStyle, borderColor: phoneError ? '#CC5555' : '#E5DDD0' }}
                  dir="ltr"
                  autoComplete="tel"
                />
                {phoneError && <p style={{ fontSize: '11px', color: '#CC5555', marginTop: '6px' }}>{phoneError}</p>}
              </div>

              {!customer && (
                <div>
                  <label style={labelStyle}>{ar ? 'البريد الإلكتروني' : 'Email'} ({ar ? 'اختياري' : 'optional'})</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} dir="ltr" autoComplete="email" />
                </div>
              )}

              <div>
                <label style={labelStyle}>{ar ? 'العنوان' : 'Address'} *</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} autoComplete="street-address" />
              </div>

              <div>
                <label style={labelStyle}>{ar ? 'المدينة' : 'City'} *</label>
                <select
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  dir={ar ? 'rtl' : 'ltr'}
                >
                  <option value="">{ar ? 'اختر مدينتك' : 'Select your city'}</option>
                  {(ar ? SAUDI_CITIES_AR : SAUDI_CITIES_EN).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>{ar ? 'ملاحظات' : 'Notes'} ({ar ? 'اختياري' : 'optional'})</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && (
                <p style={{ fontSize: '12px', color: '#CC5555', lineHeight: 1.5 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                style={{
                  width: '100%',
                  background: isPending ? '#9A8060' : '#B8975A',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  padding: '18px',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s',
                  marginTop: '8px',
                }}
              >
                {isPending
                  ? (ar ? 'جارٍ المعالجة…' : 'Processing…')
                  : (ar ? 'تأكيد الطلب' : 'Place Order')}
              </button>

              <p style={{ fontSize: '11px', color: '#6B5B4E', textAlign: 'center', lineHeight: 1.6 }}>
                {ar ? '✓ الدفع عند الاستلام · لا يلزم بطاقة' : '✓ Cash on delivery · No card required'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
