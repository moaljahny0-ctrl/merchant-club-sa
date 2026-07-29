import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ReviewsClient } from '@/components/dashboard/ReviewsClient'

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

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const service = createServiceClient()
  const { data: reviews } = await service
    .from('reviews')
    .select('id, rating, comment, status, created_at, products(title_en), customers(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(300)

  return <ReviewsClient reviews={reviews ?? []} />
}
