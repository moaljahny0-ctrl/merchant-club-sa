import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BrandProfileForm } from '@/components/dashboard/BrandProfileForm'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

export default async function BrandProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale)

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', member.brand_id)
    .single()

  if (!brand) redirect('/dashboard/brand')

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <p className="text-[13px] text-gold tracking-[0.3em] uppercase mb-1">{t.profile.eyebrow}</p>
        <h1 className="font-display text-3xl font-light text-parchment">{t.profile.heading}</h1>
        <p className="text-muted text-base mt-1">{t.profile.subheading}</p>
      </div>

      <BrandProfileForm brand={brand} locale={locale} />
    </div>
  )
}
