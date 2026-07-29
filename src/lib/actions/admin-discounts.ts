'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'
import type { DiscountType } from '@/lib/types/database'

type DiscountInput = {
  code: string
  description: string
  discount_type: DiscountType
  value: number
  min_order_amount: number
  max_uses: number | null
}

export async function adminCreateDiscount(input: DiscountInput): Promise<{ error: string | null }> {
  const code = input.code.trim().toUpperCase()
  if (!code) return { error: 'Code is required.' }
  if (!Number.isFinite(input.value) || input.value <= 0) return { error: 'Value must be greater than 0.' }
  if (input.discount_type === 'percent' && input.value > 100) return { error: 'Percent discount cannot exceed 100.' }
  if (input.min_order_amount < 0) return { error: 'Minimum order amount must be non-negative.' }

  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service.from('discount_codes').insert({
      code,
      description: input.description || null,
      discount_type: input.discount_type,
      value: input.value,
      min_order_amount: input.min_order_amount,
      max_uses: input.max_uses,
      created_by: admin.id,
    })

    if (error) return { error: error.code === '23505' ? 'A discount code with this code already exists.' : error.message }

    await logAdminAction({ actorId: admin.id, action: 'discount.create', targetType: 'discount_code', after: { ...input, code } })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/discounts')
  return { error: null }
}

export async function adminToggleDiscountActive(id: string, active: boolean): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service
      .from('discount_codes')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'discount.toggle', targetType: 'discount_code', targetId: id, after: { active } })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/discounts')
  return { error: null }
}

export async function adminDeleteDiscount(id: string): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service.from('discount_codes').delete().eq('id', id)
    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'discount.delete', targetType: 'discount_code', targetId: id })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/discounts')
  return { error: null }
}

/**
 * Validates a discount code against an order subtotal and returns the
 * discount amount. Not yet wired into the live checkout flow — payment
 * is still test-mode (real Moyasar keys outstanding per the 2026-07-27
 * commercial-readiness audit); hooking this into order totals belongs
 * with that integration, not before it.
 */
export async function validateDiscountCode(code: string, orderSubtotal: number): Promise<{ error: string | null; discountAmount: number }> {
  const service = createServiceClient()
  const now = new Date().toISOString()

  const { data: discount } = await service
    .from('discount_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .single()

  if (!discount) return { error: 'Invalid or inactive discount code.', discountAmount: 0 }
  if (discount.starts_at && discount.starts_at > now) return { error: 'This discount code is not yet active.', discountAmount: 0 }
  if (discount.ends_at && discount.ends_at < now) return { error: 'This discount code has expired.', discountAmount: 0 }
  if (discount.max_uses !== null && discount.used_count >= discount.max_uses) return { error: 'This discount code has reached its usage limit.', discountAmount: 0 }
  if (orderSubtotal < discount.min_order_amount) {
    return { error: `Order must be at least SAR ${discount.min_order_amount} to use this code.`, discountAmount: 0 }
  }

  const discountAmount = discount.discount_type === 'percent'
    ? orderSubtotal * (discount.value / 100)
    : Math.min(discount.value, orderSubtotal)

  return { error: null, discountAmount }
}
