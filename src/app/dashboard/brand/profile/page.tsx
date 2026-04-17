import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandProfileForm } from '@/components/dashboard/BrandProfileForm'

export default async function BrandProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Brand Dashboard</p>
        <h1 className="font-display text-3xl font-light text-parchment">Brand profile</h1>
        <p className="text-muted text-sm mt-1">Keep your brand information up to date.</p>
      </div>

      <BrandProfileForm brand={brand} />
    </div>
  )
}
