import { createClient, createServiceClient } from '@/lib/supabase/server'

export type ServiceClient = ReturnType<typeof createServiceClient>

export async function assertAdmin() {
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

/**
 * Granular RBAC check (R.1). Reads permissions/role_permissions, which may not
 * exist yet in this environment (migration 004_rbac_permissions.sql is written
 * but not applied everywhere) — if those tables are missing, falls back to
 * platform_admin-only so Super Admin access never breaks. Once the migration
 * is applied, granular per-role permissions activate with no further deploy.
 */
export async function assertPermission(capability: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const service = createServiceClient()
  const { data, error } = await service
    .from('user_roles')
    .select('roles!inner(name, role_permissions(permissions(capability)))')
    .eq('user_id', user.id)

  // Undefined table (migration not applied yet) — fall back to legacy admin check.
  if (error && (error.code === '42P01' || /relation .* does not exist/i.test(error.message))) {
    return assertAdmin()
  }
  if (error) throw new Error(error.message)

  type Row = {
    roles: {
      name: string
      role_permissions: { permissions: { capability: string } | { capability: string }[] | null }[]
    } | {
      name: string
      role_permissions: { permissions: { capability: string } | { capability: string }[] | null }[]
    }[]
  }

  const rows = (data ?? []) as Row[]
  const hasCapability = rows.some(r => {
    const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
    return roles.some(role => {
      if (role.name === 'platform_admin') return true // Super Admin — unrestricted
      return (role.role_permissions ?? []).some(rp => {
        const perms = Array.isArray(rp.permissions) ? rp.permissions : rp.permissions ? [rp.permissions] : []
        return perms.some(p => p.capability === capability)
      })
    })
  })

  if (!hasCapability) throw new Error('Forbidden')
  return user
}

/**
 * Best-effort audit log write (R.1 proof of concept). Never throws — a missing
 * admin_audit_log table (pre-migration) or any write failure is logged and
 * swallowed so it can never break the action it's auditing.
 */
export async function logAdminAction(params: {
  actorId: string
  action: string
  targetType: string
  targetId?: string
  before?: unknown
  after?: unknown
}): Promise<void> {
  try {
    const service = createServiceClient()
    const { error } = await service.from('admin_audit_log').insert({
      actor_id: params.actorId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
    })
    if (error) console.warn('[audit] write failed (non-fatal):', error.message)
  } catch (err) {
    console.warn('[audit] write failed (non-fatal):', err)
  }
}

export function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
