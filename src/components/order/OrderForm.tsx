'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { createOrder, type OrderFormState } from '@/lib/actions/orders'

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

const initialState: OrderFormState = { error: null, orderId: null }

const INPUT = 'w-full text-sm px-4 py-3 border border-[#E5DDD0] placeholder:text-[#6B5B4E]/40 focus:outline-none focus:border-[#B8975A] transition-colors'

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
  const [state, formAction, pending] = useActionState(createOrder, initialState)
  const isAr = locale === 'ar'

  const label    = (en: string, ar: string) => isAr ? ar : en
  const required = <span className="text-red-500 ml-0.5">*</span>

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">

      {/* ── Product summary ── */}
      <div className="md:sticky md:top-24 flex flex-col gap-5">

        {/* Back link */}
        <Link
          href={`/brands/${brandSlug}/products/${productId}`}
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
          style={{ color: '#6B5B4E' }}
        >
          <span aria-hidden>{isAr ? '→' : '←'}</span>
          <span>{label('Back to product', 'العودة للمنتج')}</span>
        </Link>

        {/* Image */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-lg"
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
            <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: '#B8975A' }}>
              {brandName}
            </p>
          )}
          <p className="text-sm font-medium leading-snug mb-2" style={{ color: '#1A1208' }}>
            {productTitle}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold" style={{ color: '#B8975A' }}>
              {displayPrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
            </span>
            {originalPrice && (
              <span className="text-sm line-through" style={{ color: '#6B5B4E' }}>
                {originalPrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-600 mt-1.5">
            {label('In Stock', 'متوفر')} — {stockQuantity} {label('units', 'وحدة')}
          </p>
        </div>
      </div>

      {/* ── Order form ── */}
      <div>
        <p className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: '#B8975A' }}>
          {label('Order Details', 'تفاصيل الطلب')}
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-light mb-8" style={{ color: '#1A1208' }}>
          {label('Place Your Order', 'أكمل طلبك')}
        </h1>

        <form action={formAction} className="flex flex-col gap-5">
          {/* Hidden fields */}
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="brand_id"   value={brandId} />
          <input type="hidden" name="locale"     value={locale} />
          <input type="hidden" name="brand_slug" value={brandSlug} />

          {/* Name */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Full Name', 'الاسم الكامل')}{required}
            </label>
            <input
              name="customer_name"
              type="text"
              required
              autoComplete="name"
              placeholder={label('Your full name', 'الاسم الكامل')}
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Phone Number', 'رقم الجوال')}{required}
            </label>
            <input
              name="customer_phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+966 5X XXX XXXX"
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
              dir="ltr"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Email', 'البريد الإلكتروني')}
              <span className="ml-1 normal-case tracking-normal" style={{ color: '#6B5B4E', opacity: 0.6 }}>
                ({label('optional', 'اختياري')})
              </span>
            </label>
            <input
              name="customer_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
              dir="ltr"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('City', 'المدينة')}{required}
            </label>
            <input
              name="customer_city"
              type="text"
              required
              autoComplete="address-level2"
              placeholder={label('e.g. Riyadh', 'مثال: الرياض')}
              className={INPUT}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Delivery Address', 'عنوان التوصيل')}{required}
            </label>
            <textarea
              name="customer_address"
              required
              rows={3}
              autoComplete="street-address"
              placeholder={label('Street, building, apartment…', 'الشارع، المبنى، الشقة...')}
              className={`${INPUT} resize-none`}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Quantity', 'الكمية')}
            </label>
            <select
              name="quantity"
              defaultValue="1"
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
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6B5B4E' }}>
              {label('Notes', 'ملاحظات')}
              <span className="ml-1 normal-case tracking-normal" style={{ color: '#6B5B4E', opacity: 0.6 }}>
                ({label('optional', 'اختياري')})
              </span>
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder={label('Any special requests or instructions', 'أي طلبات أو تعليمات خاصة')}
              className={`${INPUT} resize-none`}
              style={{ background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          {/* Error */}
          {state.error && (
            <p
              className="text-sm px-4 py-3 rounded-lg text-red-600"
              style={{ border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}
            >
              {state.error}
            </p>
          )}

          {/* Order summary */}
          <div
            className="flex items-center justify-between py-4"
            style={{ borderTop: '1px solid #E5DDD0' }}
          >
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6B5B4E' }}>
              {label('Total', 'الإجمالي')}
            </p>
            <p className="text-lg font-bold" style={{ color: '#B8975A' }}>
              {displayPrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            style={{ background: '#3D2B1F', color: '#FFFFFF', fontFamily: 'var(--font-body)' }}
          >
            {pending
              ? label('Placing Order…', 'جاري الطلب…')
              : label('Confirm Order', 'تأكيد الطلب')}
          </button>

          <p className="text-[10px] text-center" style={{ color: 'rgba(107,91,78,0.6)' }}>
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
