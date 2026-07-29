'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'

export async function adminUpdateStock(
  id: string,
  stockQuantity: number,
  lowStockThreshold: number
): Promise<{ error: string | null }> {
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return { error: 'Stock quantity must be a non-negative whole number.' }
  }
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    return { error: 'Low stock threshold must be a non-negative whole number.' }
  }

  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { data: product } = await service
      .from('products')
      .select('stock_quantity, low_stock_threshold')
      .eq('id', id)
      .single()

    const { error } = await service
      .from('products')
      .update({ stock_quantity: stockQuantity, low_stock_threshold: lowStockThreshold })
      .eq('id', id)

    if (error) return { error: error.message }

    await logAdminAction({
      actorId: admin.id,
      action: 'product.stock_update',
      targetType: 'product',
      targetId: id,
      before: product ?? undefined,
      after: { stock_quantity: stockQuantity, low_stock_threshold: lowStockThreshold },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/inventory')
  return { error: null }
}

export async function adminToggleTrackInventory(id: string, trackInventory: boolean): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service
      .from('products')
      .update({ track_inventory: trackInventory })
      .eq('id', id)

    if (error) return { error: error.message }

    await logAdminAction({
      actorId: admin.id,
      action: 'product.track_inventory_toggle',
      targetType: 'product',
      targetId: id,
      after: { track_inventory: trackInventory },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/inventory')
  return { error: null }
}
