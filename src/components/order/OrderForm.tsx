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

  const label = (en: string, ar: string) => isAr ? ar : en
  const required = <span className="text-red-400 ml-0.5">*</span>

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">

      {/* ── Product summary ── */}
      <div className="md:sticky md:top-24 flex flex-col gap-5">

        {/* Back link */}
        <Link
          href={`/brands/${brandSlug}/products/${productId}`}
          className="inline-flex items-center gap-2 text-muted hover:text-gold text-[10px] tracking-[0.2em] uppercase transition-colors"
        >
          <span aria-hidden>{isAr ? '→' : '←'}</span>
          <span>{label('Back to product', 'العودة للمنتج')}</span>
        </Link>

        {/* Image */}
        <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
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
              <div className="h-px w-12 bg-gold opacity-40" />
            </div>
          )}
        </div>

        <div>
          {brandName && (
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-1">{brandName}</p>
          )}
          <p className="text-parchment text-sm font-medium leading-snug mb-2">{productTitle}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-gold text-base">SAR {displayPrice.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-muted text-sm line-through">SAR {originalPrice.toFixed(2)}</span>
            )}
          </div>
          <p className="text-xs text-emerald-400 mt-1.5">
            {label('In Stock', 'متوفر')} — {stockQuantity} {label('units', 'وحدة')}
          </p>
        </div>
      </div>

      {/* ── Order form ── */}
      <div>
        <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-4">
          {label('Order Details', 'تفاصيل الطلب')}
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-light text-parchment mb-8">
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
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('Full Name', 'الاسم الكامل')}{required}
            </label>
            <input
              name="customer_name"
              type="text"
              required
              autoComplete="name"
              placeholder={label('Your full name', 'الاسم الكامل')}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('Phone Number', 'رقم الجوال')}{required}
            </label>
            <input
              name="customer_phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder={label('+966 5X XXX XXXX', '+966 5X XXX XXXX')}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
              dir="ltr"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('Email', 'البريد الإلكتروني')}
              <span className="text-muted/60 ml-1 normal-case tracking-normal">
                ({label('optional', 'اختياري')})
              </span>
            </label>
            <input
              name="customer_email"
              type="email"
              autoComplete="email"
              placeholder={label('you@example.com', 'you@example.com')}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
              dir="ltr"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('City', 'المدينة')}{required}
            </label>
            <input
              name="customer_city"
              type="text"
              required
              autoComplete="address-level2"
              placeholder={label('e.g. Riyadh', 'مثال: الرياض')}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('Delivery Address', 'عنوان التوصيل')}{required}
            </label>
            <textarea
              name="customer_address"
              required
              rows={3}
              autoComplete="street-address"
              placeholder={label('Street, building, apartment…', 'الشارع، المبنى، الشقة...')}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors resize-none"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('Quantity', 'الكمية')}
            </label>
            <select
              name="quantity"
              defaultValue="1"
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
            >
              {Array.from({ length: Math.min(stockQuantity, 10) }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              {label('Notes', 'ملاحظات')}
              <span className="text-muted/60 ml-1 normal-case tracking-normal">
                ({label('optional', 'اختياري')})
              </span>
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder={label('Any special requests or instructions', 'أي طلبات أو تعليمات خاصة')}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {state.error && (
            <p className="text-red-400 text-xs border border-red-400/30 bg-red-400/5 px-4 py-3">
              {state.error}
            </p>
          )}

          {/* Order summary line */}
          <div className="flex items-center justify-between py-4 border-t border-border">
            <p className="text-[10px] text-muted tracking-[0.2em] uppercase">
              {label('Total', 'الإجمالي')}
            </p>
            <p className="text-gold text-lg font-light">SAR {displayPrice.toFixed(2)}</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {pending
              ? label('Placing Order…', 'جاري الطلب…')
              : label('Confirm Order', 'تأكيد الطلب')}
          </button>

          <p className="text-[10px] text-muted/60 text-center">
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
