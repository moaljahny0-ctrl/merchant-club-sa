'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'

export type CategoryImageState = { error: string | null }

function revalidateStorefront() {
  revalidatePath('/en/store')
  revalidatePath('/ar/store')
  revalidatePath('/dashboard/admin/categories')
}

export async function updateCategoryImage(
  categoryId: string,
  _prev: CategoryImageState,
  formData: FormData
): Promise<CategoryImageState> {
  try {
    const user = await assertAdmin()
    const file = formData.get('image') as File | null
    if (!file || file.size === 0) return { error: 'Choose an image first.' }

    const service = createServiceClient()

    const { data: category } = await service
      .from('categories')
      .select('id, key, storage_path')
      .eq('id', categoryId)
      .single()

    if (!category) return { error: 'Category not found.' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const storagePath = `categories/${category.key}-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadErr } = await service.storage
      .from('product-images')
      .upload(storagePath, bytes, { contentType: file.type, upsert: true })

    if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` }

    const { data: urlData } = service.storage.from('product-images').getPublicUrl(storagePath)
    const oldPath = category.storage_path as string | null

    const { error: updateErr } = await service
      .from('categories')
      .update({ image_url: urlData.publicUrl, storage_path: storagePath, updated_at: new Date().toISOString() })
      .eq('id', categoryId)

    if (updateErr) return { error: updateErr.message }

    if (oldPath) {
      await service.storage.from('product-images').remove([oldPath])
    }

    await logAdminAction({
      actorId: user.id,
      action: 'category.image_updated',
      targetType: 'category',
      targetId: categoryId,
      after: { image_url: urlData.publicUrl },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidateStorefront()
  return { error: null }
}

export async function removeCategoryImage(categoryId: string): Promise<{ error: string | null }> {
  try {
    const user = await assertAdmin()
    const service = createServiceClient()

    const { data: category } = await service
      .from('categories')
      .select('id, storage_path')
      .eq('id', categoryId)
      .single()

    if (!category) return { error: 'Category not found.' }

    const { error: updateErr } = await service
      .from('categories')
      .update({ image_url: null, storage_path: null, updated_at: new Date().toISOString() })
      .eq('id', categoryId)

    if (updateErr) return { error: updateErr.message }

    if (category.storage_path) {
      await service.storage.from('product-images').remove([category.storage_path as string])
    }

    await logAdminAction({
      actorId: user.id,
      action: 'category.image_removed',
      targetType: 'category',
      targetId: categoryId,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidateStorefront()
  return { error: null }
}
