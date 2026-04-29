'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function NotFound() {
  const params = useParams()
  const isAr = params?.locale === 'ar'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-ink px-6 text-center"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-6">
        {isAr ? 'خطأ ٤٠٤' : 'Error 404'}
      </p>

      <h1 className="font-display text-5xl md:text-7xl font-light text-parchment mb-4 leading-tight">
        {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
      </h1>

      <p className="text-muted text-sm max-w-sm mb-10 leading-relaxed">
        {isAr
          ? 'لم نتمكن من العثور على الصفحة التي تبحث عنها.'
          : "We couldn't find the page you're looking for."}
      </p>

      <Link
        href={isAr ? '/ar' : '/'}
        className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold/90 transition-colors"
      >
        {isAr ? 'العودة للرئيسية' : 'Back to Home'}
      </Link>
    </div>
  )
}
