'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';

// Tokenizes card details directly against Moyasar from the browser, using the
// publishable key. Per Moyasar's own docs: "the tokenization process must be
// started from the client browser directly against Moyasar API" — posting
// raw card numbers to our own server first would pull us into full PCI DSS
// scope. Our server never sees anything but the resulting token.

export type CardFieldsHandle = {
  tokenize: () => Promise<{ token: string } | { error: string }>;
};

type Props = { locale: string };

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6B5B4E',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5DDD0',
  borderRadius: '8px',
  background: '#FFFFFF',
  color: '#1A1208',
  fontSize: '17px',
  padding: '12px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const isTestMode = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith('pk_test_');

export const CardFields = forwardRef<CardFieldsHandle, Props>(function CardFields({ locale }, ref) {
  const ar = locale === 'ar';
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [cvc, setCvc] = useState('');

  useImperativeHandle(ref, () => ({
    async tokenize() {
      const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY;
      if (!publishableKey) {
        return { error: ar ? 'الدفع غير مُهيأ حالياً.' : 'Payment is not configured.' };
      }

      try {
        const res = await fetch('https://api.moyasar.com/v1/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publishable_api_key: publishableKey,
            name: name.trim(),
            number: number.replace(/\s+/g, ''),
            month,
            year,
            cvc,
            save_only: false,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.id) {
          return { error: data?.message ?? (ar ? 'تعذر التحقق من بيانات البطاقة.' : 'Could not verify card details.') };
        }
        return { token: data.id as string };
      } catch {
        return { error: ar ? 'تعذر الاتصال ببوابة الدفع.' : 'Could not reach the payment gateway.' };
      }
    },
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isTestMode && (
        <p style={{ fontSize: '13px', color: '#B8975A', background: 'rgba(184,151,90,0.08)', border: '1px solid rgba(184,151,90,0.25)', borderRadius: '8px', padding: '10px 14px' }}>
          {ar
            ? 'وضع الاختبار — استخدم بطاقة 4111 1111 1111 1111، أي تاريخ مستقبلي، أي CVC.'
            : 'Test mode — use card 4111 1111 1111 1111, any future expiry, any CVC.'}
        </p>
      )}

      <div>
        <label style={labelStyle}>{ar ? 'الاسم على البطاقة' : 'Name on card'}</label>
        <input
          type="text"
          required
          autoComplete="cc-name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>{ar ? 'رقم البطاقة' : 'Card number'}</label>
        <input
          type="text"
          inputMode="numeric"
          required
          autoComplete="cc-number"
          placeholder="4111 1111 1111 1111"
          value={number}
          onChange={e => setNumber(e.target.value)}
          style={inputStyle}
          dir="ltr"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>{ar ? 'الشهر' : 'Month'}</label>
          <input
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-exp-month"
            placeholder="MM"
            maxLength={2}
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>
        <div>
          <label style={labelStyle}>{ar ? 'السنة' : 'Year'}</label>
          <input
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-exp-year"
            placeholder="YYYY"
            maxLength={4}
            value={year}
            onChange={e => setYear(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>
        <div>
          <label style={labelStyle}>CVC</label>
          <input
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            value={cvc}
            onChange={e => setCvc(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
});
