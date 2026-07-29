import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/dashboard/ReportsClient'

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

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const service = createServiceClient()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString()

  const { data: orders } = await service
    .from('orders')
    .select('id, order_number, brand_id, subtotal, status, items, created_at, brands(name_en)')
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: false })

  return <ReportsClient orders={orders ?? []} />
}
