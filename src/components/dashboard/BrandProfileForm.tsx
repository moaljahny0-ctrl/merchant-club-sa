'use client'

import { useActionState } from 'react'
import { updateBrandProfile } from '@/lib/actions/brands'
import type { Brand } from '@/lib/types/database'

export function BrandProfileForm({ brand }: { brand: Brand }) {
  const boundAction = updateBrandProfile.bind(null, brand.id)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">

      {state.error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-red-400 text-xs">{state.error}</p>
        </div>
      )}

      {state.success && !state.error && (
        <div className="border border-green-500/30 bg-green-500/10 px-4 py-3">
          <p className="text-green-400 text-xs">Profile saved successfully.</p>
        </div>
      )}

      {/* Names */}
      <section>
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Brand name</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              English <span className="text-gold">*</span>
            </label>
            <input
              name="name_en"
              required
              defaultValue={brand.name_en}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Arabic</label>
            <input
              name="name_ar"
              dir="rtl"
              defaultValue={brand.name_ar ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section>
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Tagline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">English</label>
            <input
              name="tagline_en"
              defaultValue={brand.tagline_en ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
              placeholder="A short brand tagline"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Arabic</label>
            <input
              name="tagline_ar"
              dir="rtl"
              defaultValue={brand.tagline_ar ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Description</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">English</label>
            <textarea
              name="description_en"
              rows={4}
              defaultValue={brand.description_en ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Arabic</label>
            <textarea
              name="description_ar"
              dir="rtl"
              rows={4}
              defaultValue={brand.description_ar ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none"
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Email</label>
            <input
              name="contact_email"
              type="email"
              defaultValue={brand.contact_email ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Phone</label>
            <input
              name="contact_phone"
              defaultValue={brand.contact_phone ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
              placeholder="+966 5x xxx xxxx"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Website</label>
            <input
              name="website_url"
              type="url"
              defaultValue={brand.website_url ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
              placeholder="https://yourbrand.com"
            />
          </div>
        </div>
      </section>

      {/* Policies */}
      <section>
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Policies</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Shipping info</label>
            <textarea
              name="shipping_info_en"
              rows={3}
              defaultValue={brand.shipping_info_en ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none"
              placeholder="e.g. Free shipping on orders above SAR 200…"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">Return policy</label>
            <textarea
              name="return_policy_en"
              rows={3}
              defaultValue={brand.return_policy_en ?? ''}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none"
              placeholder="e.g. Returns accepted within 14 days…"
            />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
