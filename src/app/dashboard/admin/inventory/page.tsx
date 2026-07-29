import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { InventoryClient } from '@/components/dashboard/InventoryClient'

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

export default async function AdminInventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const service = createServiceClient()
  const { data: products } = await service
    .from('products')
    .select('id, title_en, title_ar, sku, status, stock_quantity, low_stock_threshold, track_inventory, brands(name_en)')
    .neq('status', 'rejected')
    .order('stock_quantity', { ascending: true })
    .limit(500)

  return <InventoryClient products={products ?? []} />
}
