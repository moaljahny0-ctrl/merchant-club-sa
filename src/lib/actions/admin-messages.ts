'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'
import type { Message } from '@/lib/types/database'

export type BrandThread = {
  brand_id: string
  brand_name: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export async function adminGetBrandThreads(): Promise<BrandThread[]> {
  await assertAdmin()
  const service = createServiceClient()

  const [{ data: brands }, { data: messages }] = await Promise.all([
    service.from('brands').select('id, name_en').order('name_en', { ascending: true }),
    service.from('messages').select('brand_id, sender_type, body, read_at, created_at').order('created_at', { ascending: false }),
  ])

  const byBrand: Record<string, Message[]> = {}
  for (const m of (messages ?? []) as Message[]) {
    (byBrand[m.brand_id] ??= []).push(m)
  }

  return (brands ?? []).map(b => {
    const msgs = byBrand[b.id] ?? []
    const unread = msgs.filter(m => m.sender_type === 'brand' && !m.read_at).length
    return {
      brand_id: b.id,
      brand_name: b.name_en,
      last_message: msgs[0]?.body ?? null,
      last_message_at: msgs[0]?.created_at ?? null,
      unread_count: unread,
    }
  })
}

export async function adminGetMessagesForBrand(brandId: string): Promise<Message[]> {
  await assertAdmin()
  const service = createServiceClient()

  const { data: messages } = await service
    .from('messages')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true })

  const unreadIds = (messages ?? []).filter(m => m.sender_type === 'brand' && !m.read_at).map(m => m.id)
  if (unreadIds.length > 0) {
    await service.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
  }

  return messages ?? []
}

export async function adminSendMessage(brandId: string, body: string): Promise<{ error: string | null }> {
  if (!body.trim()) return { error: 'Message cannot be empty.' }

  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service.from('messages').insert({
      brand_id: brandId,
      sender_type: 'admin',
      sender_id: admin.id,
      body: body.trim(),
    })

    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'message.send', targetType: 'brand', targetId: brandId })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/messages')
  return { error: null }
}
