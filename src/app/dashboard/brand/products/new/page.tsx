import Link from 'next/link'
import { cookies } from 'next/headers'
import { createProduct } from '@/lib/actions/products'
import { ProductForm } from '@/components/dashboard/ProductForm'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

export default async function NewProductPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale).product_new_page

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard/brand/products"
          className="text-[10px] text-muted hover:text-gold tracking-[0.2em] uppercase transition-colors"
        >
          {t.back}
        </Link>
        <h1 className="font-display text-3xl font-light text-parchment mt-3">{t.heading}</h1>
        <p className="text-muted text-sm mt-1">{t.subheading}</p>
      </div>

      <ProductForm action={createProduct} submitLabel={t.create_label} locale={locale} />
    </div>
  )
}
