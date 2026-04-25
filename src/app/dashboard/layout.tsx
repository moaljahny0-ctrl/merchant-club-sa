import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import './admin-shell.css'

type Props = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's role(s) and brand membership
  const [rolesRes, memberRes] = await Promise.all([
    supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', user.id),
    supabase
      .from('brand_members')
      .select('brand_id, role, brands(id, name_en, status, onboarding_state)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const userRoles = (rolesRes.data ?? []).flatMap(
    (r: { roles: { name: string } | { name: string }[] }) =>
      Array.isArray(r.roles) ? r.roles.map(x => x.name) : [r.roles.name]
  )
  const isAdmin = userRoles.includes('platform_admin')

  // Brand member data — brands join may be an object or array depending on Supabase
  const rawBrand = memberRes.data?.brands
  const brand = rawBrand
    ? (Array.isArray(rawBrand) ? rawBrand[0] : rawBrand)
    : null

  // Sidebar badge counts (admin only)
  let adminBadges = { brands: 0, pendingApps: 0 }
  if (isAdmin) {
    const [brandsCountRes, pendingAppsRes] = await Promise.all([
      supabase.from('brands').select('id', { count: 'exact', head: true }),
      supabase.from('brand_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    adminBadges = {
      brands:      brandsCountRes.count   ?? 0,
      pendingApps: pendingAppsRes.count   ?? 0,
    }
  }

  return (
    <DashboardShell
      isAdmin={isAdmin}
      brand={brand as { id: string; name_en: string; status: string; onboarding_state: string } | null}
      userEmail={user.email ?? ''}
      adminBadges={adminBadges}
    >
      {children}
    </DashboardShell>
  )
}
