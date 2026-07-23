'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { placeOrder } from '@/lib/actions/orders'
import { CardFields, type CardFieldsHandle } from '@/components/checkout/CardFields'

type Props = {
  productId: string
  brandId: string
  brandSlug: string
  locale: string
  productTitle: string
  brandName: string
  displayPrice: number
  originalPrice: number | null
  primaryImageUrl: string | null
  stockQuantity: number
}

const INPUT = 'w-full text-base px-4 py-3 rounded-lg border border-[#E5DDD0] placeholder:text-[#6B5B4E]/40 focus:outline-none focus:border-[#B8975A] transition-colors'
const CARD_PAYMENT_AVAILABLE = Boolean(process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY)

export function OrderForm({
  productId,
  brandId,
  brandSlug,
  locale,
  productTitle,
  brandName,
  displayPrice,
  originalPrice,
  primaryImageUrl,
  stockQuantity,
}: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod')
  const cardFieldsRef = useRef<CardFieldsHandle>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const label    = (en: string, ar: string) => isAr ? ar : en
  const required = <span className="text-red-500 ml-0.5">*</span>

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (phone.replace(/\D/g, '').length < 9) {
      setError(label('Please enter a valid phone number.', 'يرجى إدخال رقم جوال صحيح.'))
      return
    }

    startTransition(async () => {
      let paymentToken: string | undefined

      if (paymentMethod === 'card') {
        const tokenResult = await cardFieldsRef.current?.tokenize()
        if (!tokenResult || 'error' in tokenResult) {
          setError(tokenResult?.error ?? label('Could not verify card details.', 'تعذر التحقق من بيانات البطاقة.'))
          return
        }
        paymentToken = tokenResult.token
      }

      const result = await placeOrder({
        cartItems: [{
          productId,
          brandId,
          brandSlug,
          productName: productTitle,
          brandName,
          price: displayPrice,
          quantity,
          image_url: primaryImageUrl,
        }],
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || null,
        customerCity: city.trim(),
        customerAddress: address.trim(),
        notes: notes.trim() || null,
        locale,
        paymentMethod,
        paymentToken,
      })

      if (result.kind === 'error') {
        setError(result.error)
        return
      }

      if (result.kind === 'redirect') {
        window.location.href = result.redirectUrl
        return
      }

      const orderParam = result.orderNumbers.join(',')
      router.push(`/store/order-confirmation?order=${encodeURIComponent(orderParam)}`)
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">

      {/* ── Product summary ── */}
      <div className="md:sticky md:top-24 flex flex-col gap-5">

        {/* Back link */}
        <Button href={`/brands/${brandSlug}/products/${productId}`} variant="back" style={{ color: '#6B5B4E' }}>
          <span aria-hidden>{isAr ? '→' : '←'}</span>
          <span>{label('Back to product', 'العودة للمنتج')}</span>
        </Button>

        {/* Image */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-xl"
          style={{ background: '#F0EBE1' }}
        >
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={productTitle}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              quality={85}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-12" style={{ background: '#E5DDD0' }} />
            </div>
          )}
        </div>

        <div>
          {brandName && (
            <p className="text-[13px] font-medium tracking-[0.1em] uppercase mb-1" style={{ color: '#B8975A' }}>
              {brandName}
            </p>
          )}
          <p className="text-base font-medium leading-snug mb-2" style={{ color: '#1A1208' }}>
            {productTitle}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold" style={{ color: '#B8975A' }}>
              {displayPrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
            </span>
            {originalPrice && (
              <span className="text-base line-through" style={{ color: '#6B5B4E' }}>
                {originalPrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
              </span>
            )}
          </div>
          <p className="text-sm text-emerald-600 mt-1.5">
            {label('In Stock', 'متوفر')} — {stockQuantity} {label('units', 'وحدة')}
          </p>
        </div>
      </div>

      {/* ── Order form ── */}
      <div>
        <p className="text-[13px] font-medium tracking-[0.1em] uppercase mb-4" style={{ color: '#B8975A' }}>
          {label('Order Details', 'تفاصيل الطلب')}
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: '#1A1208', letterSpacing: '-0.01em' }}>
          {label('Place Your Order', 'أكمل طلبك')}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Full Name', 'الاسم الكامل')}{required}
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              placeholder={label('Your full name', 'الاسم الكامل')}
              value={name}
              onChange={e => setName(e.target.value)}
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Phone Number', 'رقم الجوال')}{required}
            </label>
            <input
              type="tel"
              required
              autoComplete="tel"
              placeholder="+966 5X XXX XXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
              dir="ltr"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Email', 'البريد الإلكتروني')}
              <span className="ml-1 normal-case tracking-normal" style={{ color: '#6B5B4E', opacity: 0.6 }}>
                ({label('optional', 'اختياري')})
              </span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
              dir="ltr"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('City', 'المدينة')}{required}
            </label>
            <input
              type="text"
              required
              autoComplete="address-level2"
              placeholder={label('e.g. Riyadh', 'مثال: الرياض')}
              value={city}
              onChange={e => setCity(e.target.value)}
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Delivery Address', 'عنوان التوصيل')}{required}
            </label>
            <textarea
              required
              rows={3}
              autoComplete="street-address"
              placeholder={label('Street, building, apartment…', 'الشارع، المبنى، الشقة...')}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className={`${INPUT} resize-none`}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Quantity', 'الكمية')}
            </label>
            <select
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className={`${INPUT} appearance-none cursor-pointer`}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            >
              {Array.from({ length: Math.min(stockQuantity, 10) }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Notes', 'ملاحظات')}
              <span className="ml-1 normal-case tracking-normal" style={{ color: '#6B5B4E', opacity: 0.6 }}>
                ({label('optional', 'اختياري')})
              </span>
            </label>
            <textarea
              rows={2}
              placeholder={label('Any special requests or instructions', 'أي طلبات أو تعليمات خاصة')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={`${INPUT} resize-none`}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Payment method */}
          {CARD_PAYMENT_AVAILABLE && (
            <div>
              <label className="block text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
                {label('Payment Method', 'طريقة الدفع')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['cod', 'card'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className="rounded-lg px-4 py-3 text-sm font-semibold"
                    style={{
                      border: `1px solid ${paymentMethod === method ? '#B8975A' : '#E5DDD0'}`,
                      background: paymentMethod === method ? 'rgba(184,151,90,0.08)' : '#FFFFFF',
                      color: '#1A1208',
                    }}
                  >
                    {method === 'cod' ? label('Cash on Delivery', 'الدفع عند الاستلام') : label('Credit Card', 'بطاقة ائتمان')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'card' && CARD_PAYMENT_AVAILABLE && (
            <CardFields ref={cardFieldsRef} locale={locale} />
          )}

          {/* Error */}
          {error && (
            <p
              className="text-base px-4 py-3 rounded-lg text-red-600"
              style={{ border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}
            >
              {error}
            </p>
          )}

          {/* Order summary */}
          <div
            className="flex items-center justify-between py-4"
            style={{ borderTop: '1px solid #E5DDD0' }}
          >
            <p className="text-[13px] font-medium tracking-[0.08em] uppercase" style={{ color: '#6B5B4E' }}>
              {label('Total', 'الإجمالي')}
            </p>
            <p className="text-lg font-bold" style={{ color: '#B8975A' }}>
              {(displayPrice * quantity).toFixed(2)} {isAr ? 'ريال' : 'SAR'}
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            variant="primary"
            fullWidth
            style={{ background: '#3D2B1F', color: '#FFFFFF', fontFamily: 'var(--font-body)' }}
          >
            {isPending
              ? label('Placing Order…', 'جاري الطلب…')
              : label('Confirm Order', 'تأكيد الطلب')}
          </Button>

          <p className="text-[13px] text-center" style={{ color: 'rgba(107,91,78,0.6)' }}>
            {label(
              'By placing this order you agree to the delivery terms of the brand.',
              'بتأكيد طلبك توافق على شروط التوصيل الخاصة بالمتجر.'
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
