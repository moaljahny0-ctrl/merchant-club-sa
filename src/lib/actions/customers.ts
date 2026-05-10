'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function setupCustomerProfile(
  fullName: string,
  phone: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const service = createServiceClient()

  const { error: profileError } = await service
    .from('customer_profiles')
    .upsert(
      { id: user.id, full_name: fullName, phone, email: user.email ?? null },
      { onConflict: 'id' }
    )

  if (profileError) return { error: profileError.message }

  // Link unowned guest orders by phone — fire-and-forget
  service
    .from('orders')
    .update({ customer_user_id: user.id })
    .eq('customer_phone', phone)
    .is('customer_user_id', null)
    .then(({ error }) => {
      if (error) console.error('[customers] order link failed:', error)
    })

  return { error: null }
}
