'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.id)

  const isAdmin = (data ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'platform_admin')
    }
  )

  if (!isAdmin) throw new Error('Forbidden')
  return user
}

// ── slug ──────────────────────────────────────────────────────────────────────

type ServiceClient = ReturnType<typeof createServiceClient>

async function generateUniqueSlug(service: ServiceClient, name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'brand'

  let slug = base
  let attempt = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await service.from('brands').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ── applications ──────────────────────────────────────────────────────────────

export async function reviewApplication(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()
    const now = new Date().toISOString()

    // ── Rejection: simple status update ──────────────────────────────────────
    if (action === 'reject') {
      const { error } = await service
        .from('brand_applications')
        .update({
          status: 'rejected',
          reviewed_by: admin.id,
          reviewed_at: now,
          rejection_reason: rejectionReason ?? '',
        })
        .eq('id', id)

      if (error) return { error: error.message }
      revalidatePath('/dashboard/admin/applications')
      return { error: null }
    }

    // ── Approval: full onboarding flow ────────────────────────────────────────

    // 1. Fetch the application
    const { data: app, error: fetchErr } = await service
      .from('brand_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !app) return { error: fetchErr?.message ?? 'Application not found' }
    if (app.status !== 'pending') return { error: `Application is already ${app.status}` }

    // 2. Invite the brand owner — creates the auth user and sends the invite email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

    let userId: string
    const { data: inviteData, error: inviteErr } = await service.auth.admin.inviteUserByEmail(
      app.contact_email,
      { redirectTo: `${siteUrl}/auth/invite` }
    )

    if (inviteErr) {
      // User already exists — find them by email
      if (inviteErr.status === 422 || inviteErr.message?.toLowerCase().includes('already')) {
        const { data: listData, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 })
        if (listErr) return { error: listErr.message }
        const existing = listData.users.find(u => u.email === app.contact_email)
        if (!existing) return { error: `User exists but could not be located: ${inviteErr.message}` }
        userId = existing.id
      } else {
        return { error: inviteErr.message }
      }
    } else {
      userId = inviteData.user.id
    }

    // 3. Generate a unique slug from the brand name
    const slug = await generateUniqueSlug(service, app.brand_name_en)

    // 4. Create the brand record
    const { data: brand, error: brandErr } = await service
      .from('brands')
      .insert({
        slug,
        name_en: app.brand_name_en,
        name_ar: app.brand_name_ar ?? null,
        contact_email: app.contact_email,
        contact_phone: app.contact_phone ?? null,
        website_url: app.website_url ?? null,
        status: 'pending',
        onboarding_state: 'invited',
      })
      .select('id')
      .single()

    if (brandErr || !brand) return { error: brandErr?.message ?? 'Failed to create brand' }

    // 5. Link the user to the brand as owner
    const { error: memberErr } = await service
      .from('brand_members')
      .insert({
        brand_id: brand.id,
        user_id: userId,
        role: 'brand_owner',
        invited_by: admin.id,
        status: 'active',
        joined_at: now,
      })

    if (memberErr) return { error: memberErr.message }

    // 6. Assign the brand_owner role in user_roles
    const { data: roleRow } = await service
      .from('roles')
      .select('id')
      .eq('name', 'brand_owner')
      .single()

    if (roleRow) {
      // upsert is safe: no-op if the user already has this role
      await service
        .from('user_roles')
        .upsert({ user_id: userId, role_id: roleRow.id })
    }

    // 7. Mark the application as approved and link the new brand
    const { error: appUpdateErr } = await service
      .from('brand_applications')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: now,
        brand_id: brand.id,
      })
      .eq('id', id)

    if (appUpdateErr) return { error: appUpdateErr.message }

  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/applications')
  return { error: null }
}

// ── products ──────────────────────────────────────────────────────────────────

export async function adminReviewProduct(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const user = await assertAdmin()
    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from('products')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        ...(action === 'reject' ? { rejection_reason: rejectionReason ?? '' } : {}),
      })
      .eq('id', id)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/products')
  return { error: null }
}
