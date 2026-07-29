import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/dashboard/SettingsClient'
import type { PlatformSettings } from '@/lib/types/database'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', userId)

  const isAdmin = (data ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'platform_admin')
    }
  )
  if (!isAdmin) redirect('/dashboard/brand')
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const service = createServiceClient()
  const { data: settings } = await service
    .from('platform_settings')
    .select('*')
    .eq('id', true)
    .single()

  const fallback: PlatformSettings = {
    id: true,
    site_name: 'Merchant Club SA',
    support_email: 'info@merchantclubsa.com',
    maintenance_mode: false,
    commission_rate_pct: 0,
    low_stock_default_threshold: 5,
    updated_by: null,
    updated_at: new Date().toISOString(),
  }

  return <SettingsClient settings={(settings as PlatformSettings) ?? fallback} userEmail={user.email ?? ''} />
}
