import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DiscountsClient } from '@/components/dashboard/DiscountsClient'

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

export default async function AdminDiscountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const service = createServiceClient()
  const { data: discounts } = await service
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return <DiscountsClient discounts={discounts ?? []} />
}
