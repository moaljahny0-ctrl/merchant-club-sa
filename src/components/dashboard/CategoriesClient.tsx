'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateCategoryImage, removeCategoryImage } from '@/lib/actions/admin-categories'
import type { Category } from '@/lib/types/database'

type Props = {
  categories: Category[]
}

export function CategoriesClient({ categories }: Props) {
  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-parchment">Categories</h1>
        <p className="text-muted text-sm mt-1">
          Cover photo shown for each category in the storefront&apos;s &ldquo;Browse by Category&rdquo; section. Applies to both languages.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}

function CategoryCard({ category }: { category: Category }) {
  const boundAction = updateCategoryImage.bind(null, category.id)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })
  const [previewUrl, setPreviewUrl] = useState<string | null>(category.image_url)
  const [isRemoving, startRemoveTransition] = useTransition()

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const result = await removeCategoryImage(category.id)
      if (result.error) {
        alert(result.error)
      } else {
        setPreviewUrl(null)
      }
    })
  }

  return (
    <div className="border border-border bg-surface p-5 flex flex-col gap-4">
      <div>
        <p className="text-parchment text-base font-medium">{category.name_en}</p>
        <p className="text-muted text-sm" dir="rtl">{category.name_ar}</p>
      </div>

      <div className="relative aspect-[4/3] bg-ink border border-border overflow-hidden">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="w-full h-full object-cover block" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] text-muted/50 tracking-[0.2em] uppercase">No photo</span>
          </div>
        )}
      </div>

      {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <form action={formAction} className="flex items-center gap-2">
        <label className="flex-1 flex items-center justify-center gap-2 border border-border border-dashed px-3 py-2.5 cursor-pointer hover:border-gold transition-colors group">
          <span className="text-[12px] text-muted tracking-[0.1em] uppercase group-hover:text-gold transition-colors">
            {previewUrl ? 'Replace' : 'Upload'}
          </span>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleImageChange}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="bg-gold text-ink text-[12px] font-medium tracking-[0.1em] uppercase px-4 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </form>

      {category.image_url && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-[12px] text-red-400/70 hover:text-red-400 tracking-[0.1em] uppercase transition-colors self-start disabled:opacity-50"
        >
          {isRemoving ? 'Removing…' : 'Remove photo'}
        </button>
      )}
    </div>
  )
}
