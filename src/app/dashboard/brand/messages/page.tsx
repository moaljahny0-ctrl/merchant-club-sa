import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getBrandMessages } from '@/lib/actions/brand-messages'
import { BrandMessagesClient } from '@/components/dashboard/BrandMessagesClient'
import type { DashLang } from '@/lib/dashboard-i18n'

export default async function BrandMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const messages = await getBrandMessages()

  return <BrandMessagesClient initialMessages={messages} locale={locale} />
}
