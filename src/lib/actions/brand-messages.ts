'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Message } from '@/lib/types/database'

async function assertBrandMember(): Promise<{ userId: string; brandId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) throw new Error('Forbidden')
  return { userId: user.id, brandId: member.brand_id }
}

export async function getBrandMessages(): Promise<Message[]> {
  const { brandId } = await assertBrandMember()
  const service = createServiceClient()

  const { data: messages } = await service
    .from('messages')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true })

  const unreadIds = (messages ?? []).filter(m => m.sender_type === 'admin' && !m.read_at).map(m => m.id)
  if (unreadIds.length > 0) {
    await service.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
  }

  return messages ?? []
}

export async function sendBrandMessage(body: string): Promise<{ error: string | null }> {
  if (!body.trim()) return { error: 'Message cannot be empty.' }

  try {
    const { userId, brandId } = await assertBrandMember()
    const service = createServiceClient()

    const { error } = await service.from('messages').insert({
      brand_id: brandId,
      sender_type: 'brand',
      sender_id: userId,
      body: body.trim(),
    })

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/messages')
  return { error: null }
}
