import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandOrdersClient } from '@/components/dashboard/BrandOrdersClient'

export default async function BrandOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, customer_phone, delivery_address, items, subtotal, status, created_at, tracking_number, brand_notes, creator_link_id, creator_links(link_code, commission_rate)')
    .eq('brand_id', member.brand_id)
    .order('created_at', { ascending: false })
    .limit(200)

  const orders = ordersRaw ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <BrandOrdersClient orders={orders as any} />
}
