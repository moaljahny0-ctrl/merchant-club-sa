import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandsClient } from '@/components/dashboard/BrandsClient'

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

export default async function AdminBrandsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name_en, name_ar, slug, status, created_at, contact_email, contact_phone')
    .order('created_at', { ascending: false })
    .limit(200)

  // Product counts per brand
  const { data: productCounts } = await supabase
    .from('products')
    .select('brand_id, status')

  const liveCountByBrand: Record<string, number> = {}
  for (const p of productCounts ?? []) {
    if (p.status === 'live') {
      liveCountByBrand[p.brand_id] = (liveCountByBrand[p.brand_id] ?? 0) + 1
    }
  }

  const brandsWithCounts = (brands ?? []).map(b => ({
    ...b,
    live_products: liveCountByBrand[b.id] ?? 0,
  }))

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Admin</p>
        <h1 className="font-display text-3xl font-light text-parchment">Brands</h1>
      </div>

      <BrandsClient brands={brandsWithCounts} />
    </div>
  )
}
