'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertCreator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.id)

  const isCreator = (data ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'creator')
    }
  )

  if (!isCreator) throw new Error('Forbidden')
  return user
}

function generateLinkCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// creator_links has no self-service INSERT policy yet (only admin/service-role
// can write to it — see supabase/migrations/003_creator_self_service_links.sql,
// which adds the correct RLS policy for direct client access down the line).
// Using the service client here with an explicit assertCreator() check above,
// same pattern as the admin actions, so this works today without waiting on
// that migration being applied to the live project.
export async function generateCreatorLink(brandId: string): Promise<{ error: string | null; linkCode?: string }> {
  try {
    const user = await assertCreator()
    const service = createServiceClient()

    const { data: brand } = await service
      .from('brands')
      .select('id, status')
      .eq('id', brandId)
      .single()

    if (!brand || !['approved', 'active'].includes(brand.status)) {
      return { error: 'This brand is not live yet' }
    }

    const { data: existing } = await service
      .from('creator_links')
      .select('link_code')
      .eq('creator_id', user.id)
      .eq('brand_id', brandId)
      .maybeSingle()

    if (existing) {
      return { error: null, linkCode: existing.link_code }
    }

    let linkCode = generateLinkCode()
    let attempt = 0
    // link_code is globally unique — retry on collision (very unlikely at 8 chars)
    while (true) {
      const { data: clash } = await service
        .from('creator_links')
        .select('id')
        .eq('link_code', linkCode)
        .maybeSingle()
      if (!clash) break
      attempt++
      if (attempt > 5) return { error: 'Could not generate a unique link — try again' }
      linkCode = generateLinkCode()
    }

    const { error: insertErr } = await service
      .from('creator_links')
      .insert({
        creator_id: user.id,
        brand_id: brandId,
        link_code: linkCode,
      })

    if (insertErr) return { error: insertErr.message }

    revalidatePath('/dashboard/creator')
    return { error: null, linkCode }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
