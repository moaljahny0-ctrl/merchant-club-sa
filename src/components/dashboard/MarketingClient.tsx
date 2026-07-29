'use client'

import { useState, useTransition } from 'react'
import { adminCreateBanner, adminToggleBannerActive, adminDeleteBanner } from '@/lib/actions/admin-marketing'
import type { MarketingBanner } from '@/lib/types/database'

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '8px 12px', fontSize: '14px',
  color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const labelStyle: React.CSSProperties = {
  fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', display: 'block',
}

export function MarketingClient({ banners }: { banners: MarketingBanner[] }) {
  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Marketing
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '18px', maxWidth: '640px' }}>
        Promotional banners for the storefront homepage. Managed here; rendering them on the live storefront is a separate, not-yet-scoped integration.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '18px', alignItems: 'start' }}>
        <NewBannerForm nextSortOrder={banners.length} />
        <BannerList banners={banners} />
      </div>
    </>
  )
}

function NewBannerForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await adminCreateBanner({
        title, subtitle: subtitle || null, image_url: imageUrl || null, link_url: linkUrl || null, sort_order: nextSortOrder,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setTitle(''); setSubtitle(''); setImageUrl(''); setLinkUrl('')
      }
    })
  }

  return (
    <div className="a-chart-card">
      <div className="a-card-title" style={{ marginBottom: '14px' }}>New Banner</div>

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '6px', padding: '8px 10px', marginBottom: '12px', fontSize: '13px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Title</label>
        <input style={fieldStyle} value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Subtitle</label>
        <input style={fieldStyle} value={subtitle} onChange={e => setSubtitle(e.target.value)} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Image URL</label>
        <input style={fieldStyle} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Link URL</label>
        <input style={fieldStyle} value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="/en/brands/…" />
      </div>

      <button
        className="a-action-btn a-primary"
        onClick={handleCreate}
        disabled={isPending || !title.trim()}
        style={{ opacity: isPending || !title.trim() ? 0.5 : 1, width: '100%' }}
      >
        {isPending ? 'Creating…' : 'Create Banner'}
      </button>
    </div>
  )
}

function BannerList({ banners }: { banners: MarketingBanner[] }) {
  if (banners.length === 0) {
    return (
      <div className="a-chart-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '14px' }}>
        No banners yet
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {banners.map(banner => <BannerCard key={banner.id} banner={banner} />)}
    </div>
  )
}

function BannerCard({ banner }: { banner: MarketingBanner }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await adminToggleBannerActive(banner.id, !banner.is_active)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete banner "${banner.title}"?`)) return
    setError(null)
    startTransition(async () => {
      const result = await adminDeleteBanner(banner.id)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="a-chart-card" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
      {banner.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.image_url} alt={banner.title} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', flexShrink: 0 }} />
      ) : (
        <div style={{ width: '64px', height: '64px', borderRadius: '6px', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
          📣
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{banner.title}</div>
        {banner.subtitle && <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '2px' }}>{banner.subtitle}</div>}
        {banner.link_url && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{banner.link_url}</div>}
        {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{error}</div>}
      </div>

      <span className="a-pill" style={banner.is_active ? { background: 'var(--green-bg)', color: 'var(--green)' } : { background: 'var(--border2)', color: 'var(--text3)' }}>
        {banner.is_active ? 'Active' : 'Inactive'}
      </span>

      <div style={{ display: 'flex', gap: '5px' }}>
        <button className="a-action-btn" onClick={handleToggle} disabled={isPending} style={{ padding: '4px 10px', fontSize: '13px', opacity: isPending ? 0.5 : 1 }}>
          {banner.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          className="a-action-btn"
          onClick={handleDelete}
          disabled={isPending}
          style={{ padding: '4px 10px', fontSize: '13px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1 }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
