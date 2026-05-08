'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { updateBrandProfile, uploadBrandLogo, saveBrandLogoUrl } from '@/lib/actions/brands'
import { createClient } from '@/lib/supabase/client'
import type { Brand } from '@/lib/types/database'

function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setNewPassword('')
        setConfirm('')
      }
    })
  }

  return (
    <section>
      <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Change password</h2>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      {success && (
        <div className="border border-green-500/30 bg-green-500/10 px-4 py-3 mb-4">
          <p className="text-green-400 text-xs">Password updated successfully.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            New password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Confirm password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}

export function BrandProfileForm({ brand }: { brand: Brand }) {
  const boundAction = updateBrandProfile.bind(null, brand.id)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  // ── Logo state ──────────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl]       = useState<string>(brand.logo_url ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError]   = useState<string | null>(null)
  const [logoSuccess, setLogoSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Only JPG, PNG, or WebP files are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File must be under 2 MB.')
      return
    }

    setLogoUploading(true)
    setLogoError(null)
    setLogoSuccess(false)

    const fd = new FormData()
    fd.append('logo', file)

    const { url, error: uploadErr } = await uploadBrandLogo(brand.id, fd)

    if (uploadErr || !url) {
      setLogoError(uploadErr ?? 'Upload failed.')
      setLogoUploading(false)
      return
    }

    const { error: saveErr } = await saveBrandLogoUrl(brand.id, url)
    setLogoUploading(false)

    if (saveErr) {
      setLogoError(saveErr)
      return
    }

    setLogoUrl(url)
    setLogoSuccess(true)
    setTimeout(() => setLogoSuccess(false), 3000)
    // Reset file input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
    <form action={formAction} className="space-y-8 max-w-2xl">

      {/* Hidden field so logo_url is preserved on profile save */}
      <input type="hidden" name="logo_url" value={logoUrl} />

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

      {/* Logo */}
      <section>
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Brand Logo</h2>
        <div className="flex items-center gap-6">

          {/* Preview */}
          <div className="relative w-20 h-20 shrink-0 bg-surface border border-border overflow-hidden flex items-center justify-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Brand logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-muted/50 tracking-wider uppercase">No logo</span>
            )}
            {logoUploading && (
              <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                <span className="text-[10px] text-parchment/80 tracking-widest uppercase animate-pulse">
                  Uploading…
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2">
            <label
              className={`inline-flex items-center justify-center bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-5 py-2.5 transition-opacity cursor-pointer ${logoUploading ? 'opacity-40 pointer-events-none' : 'hover:bg-gold-light'}`}
            >
              {logoUploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleLogoChange}
                disabled={logoUploading}
              />
            </label>
            <p className="text-[10px] text-muted/60">JPG, PNG or WebP · max 2 MB</p>
            {logoError && <p className="text-xs text-red-400">{logoError}</p>}
            {logoSuccess && <p className="text-xs text-green-400">Logo saved ✓</p>}
          </div>

        </div>
      </section>

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

    <div className="mt-12 pt-10 border-t border-border max-w-2xl">
      <ChangePasswordForm />
    </div>
    </div>
  )
}
