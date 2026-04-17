import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductReviewClient } from '@/components/dashboard/ProductReviewClient'

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

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const { data: products } = await supabase
    .from('products')
    .select('*, brands(name_en)')
    .order('updated_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Admin</p>
        <h1 className="font-display text-3xl font-light text-parchment">Product review</h1>
      </div>

      <ProductReviewClient products={products ?? []} />
    </div>
  )
}
