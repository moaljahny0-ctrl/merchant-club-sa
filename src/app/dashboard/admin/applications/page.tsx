import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationReviewClient } from '@/components/dashboard/ApplicationReviewClient'

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

export default async function AdminApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const { data: applications } = await supabase
    .from('brand_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Admin</p>
        <h1 className="font-display text-3xl font-light text-parchment">Brand applications</h1>
      </div>

      <ApplicationReviewClient applications={applications ?? []} />
    </div>
  )
}
