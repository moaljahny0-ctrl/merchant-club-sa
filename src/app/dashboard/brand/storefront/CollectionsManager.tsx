'use client'

import { useState, useTransition } from 'react'
import { createCollection, deleteCollection, setCollectionProducts } from '@/lib/actions/brands'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import type { CollectionWithProducts } from '@/lib/types/database'

type LiveProduct = { id: string; title_en: string; title_ar: string | null }

export function CollectionsManager({
  brandId,
  products,
  initialCollections,
  locale = 'en',
}: {
  brandId: string
  products: LiveProduct[]
  initialCollections: CollectionWithProducts[]
  locale?: DashLang
}) {
  const t = dt(locale).storefront
  const [collections, setCollections] = useState(initialCollections)
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!nameEn.trim()) return
    startTransition(async () => {
      const result = await createCollection(brandId, { nameEn: nameEn.trim(), nameAr: nameAr.trim() || null })
      if (!result.error && result.id) {
        setCollections(prev => [...prev, { id: result.id!, brand_id: brandId, name_en: nameEn.trim(), name_ar: nameAr.trim() || null, position: prev.length, created_at: '', updated_at: '', product_ids: [] }])
        setNameEn('')
        setNameAr('')
      }
    })
  }

  function handleDelete(collectionId: string) {
    startTransition(async () => {
      const result = await deleteCollection(brandId, collectionId)
      if (!result.error) {
        setCollections(prev => prev.filter(c => c.id !== collectionId))
      }
    })
  }

  function toggleProduct(collectionId: string, productId: string) {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return
    const nextIds = collection.product_ids.includes(productId)
      ? collection.product_ids.filter(id => id !== productId)
      : [...collection.product_ids, productId]

    setCollections(prev => prev.map(c => (c.id === collectionId ? { ...c, product_ids: nextIds } : c)))
    startTransition(async () => {
      await setCollectionProducts(brandId, collectionId, nextIds)
    })
  }

  return (
    <div className="mb-8 border border-border px-6 py-5">
      <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-1">{t.collections_heading}</p>
      <p className="text-muted text-xs mb-5">{t.collections_body}</p>

      {collections.length === 0 && (
        <p className="text-muted text-sm mb-5">{t.collections_none}</p>
      )}

      <div className="space-y-4 mb-5">
        {collections.map(collection => {
          const name = locale === 'ar' && collection.name_ar ? collection.name_ar : collection.name_en
          return (
            <div key={collection.id} className="border border-border/60 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-parchment">{name}</p>
                <button
                  onClick={() => handleDelete(collection.id)}
                  disabled={isPending}
                  className="text-[9px] tracking-[0.15em] uppercase text-muted/60 hover:text-red-400 transition-colors"
                >
                  {t.collection_delete}
                </button>
              </div>
              <p className="text-[9px] text-muted/50 tracking-[0.15em] uppercase mb-2">{t.collection_products}</p>
              <div className="flex flex-wrap gap-2">
                {products.map(product => {
                  const title = locale === 'ar' && product.title_ar ? product.title_ar : product.title_en
                  const inCollection = collection.product_ids.includes(product.id)
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(collection.id, product.id)}
                      className={`text-[10px] px-3 py-1.5 border transition-colors ${
                        inCollection ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted hover:text-parchment'
                      }`}
                    >
                      {title}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder={t.collection_name_en}
          value={nameEn}
          onChange={e => setNameEn(e.target.value)}
          className="bg-surface border border-border px-3 py-2 text-sm text-parchment placeholder:text-muted/40 flex-1 min-w-[150px]"
        />
        <input
          type="text"
          placeholder={t.collection_name_ar}
          value={nameAr}
          onChange={e => setNameAr(e.target.value)}
          className="bg-surface border border-border px-3 py-2 text-sm text-parchment placeholder:text-muted/40 flex-1 min-w-[150px]"
        />
        <button
          onClick={handleCreate}
          disabled={isPending || !nameEn.trim()}
          className="text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border border-gold text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
        >
          {t.collection_create}
        </button>
      </div>
    </div>
  )
}
