import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [rolesRes, memberRes] = await Promise.all([
    supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', user.id),
    supabase
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const userRoles = (rolesRes.data ?? []).flatMap(
    (r: { roles: { name: string } | { name: string }[] }) =>
      Array.isArray(r.roles) ? r.roles.map(x => x.name) : [r.roles.name]
  )
  const isAdmin = userRoles.includes('platform_admin')
  const isCreator = userRoles.includes('creator')
  const hasBrand = !!memberRes.data

  if (isAdmin) redirect('/dashboard/admin')
  if (hasBrand) redirect('/dashboard/brand')
  if (isCreator) redirect('/dashboard/creator')
  redirect('/dashboard/brand')
}
