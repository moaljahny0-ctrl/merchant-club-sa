'use client'

import { useState, useTransition } from 'react'
import { adminUpdateBrandStatus } from '@/lib/actions/admin'

type Brand = {
  id: string
  name_en: string
  name_ar: string | null
  slug: string
  status: string
  created_at: string
  contact_email: string | null
  contact_phone: string | null
  live_products: number
}

const STATUS_BADGE: Record<string, string> = {
  approved: 'border-green-700/40 text-green-400/80 bg-green-900/10',
  active:   'border-green-700/40 text-green-400/80 bg-green-900/10',
  pending:  'border-yellow-700/40 text-yellow-400/80 bg-yellow-900/10',
  suspended:'border-red-700/40 text-red-400/80 bg-red-900/10',
  rejected: 'border-border text-muted/60',
}

export function BrandsClient({ brands }: { brands: Brand[] }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const counts: Record<string, number> = { all: brands.length }
  for (const b of brands) {
    counts[b.status] = (counts[b.status] ?? 0) + 1
  }

  const filtered = brands.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter
    const matchesSearch = !search || b.name_en.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="w-full max-w-sm bg-surface border border-border text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {['all', 'approved', 'active', 'pending', 'suspended', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
              filter === tab
                ? 'text-gold border-b border-gold'
                : 'text-muted hover:text-parchment'
            }`}
          >
            {tab} {counts[tab] ? `(${counts[tab]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No brands in this filter.</p>
      ) : (
        <div className="border border-border divide-y divide-border">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_80px_100px_160px] gap-4 px-5 py-3 bg-surface">
            {['Brand', 'Status', 'Live Products', 'Joined', 'Actions'].map(h => (
              <p key={h} className="text-[8px] text-muted/50 tracking-[0.2em] uppercase">{h}</p>
            ))}
          </div>

          {filtered.map(brand => (
            <BrandRow key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      <p className="text-[9px] text-muted/40 tracking-wide mt-5">
        {filtered.length} brand{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

function BrandRow({ brand }: { brand: Brand }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleStatus(status: 'approved' | 'suspended') {
    setActionError(null)
    startTransition(async () => {
      const result = await adminUpdateBrandStatus(brand.id, status)
      if (result.error) setActionError(result.error)
    })
  }

  return (
    <div>
      <button
        className="w-full text-left px-5 py-4 hover:bg-surface transition-colors md:grid md:grid-cols-[1fr_120px_80px_100px_160px] gap-4 items-center flex justify-between"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0">
          <p className="text-parchment text-sm font-medium truncate">{brand.name_en}</p>
          <p className="text-muted text-xs mt-0.5 truncate">{brand.contact_email ?? '—'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 md:shrink">
          <span className={`hidden md:inline-block text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 border ${STATUS_BADGE[brand.status] ?? 'border-border text-muted/60'}`}>
            {brand.status}
          </span>
          <p className="hidden md:block text-parchment text-sm text-center">{brand.live_products}</p>
          <p className="hidden md:block text-muted text-xs">
            {new Date(brand.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <span className="text-muted text-xs ml-2">{expanded ? '↑' : '↓'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-surface/50 px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Slug', value: brand.slug },
              { label: 'Status', value: brand.status },
              { label: 'Phone', value: brand.contact_phone },
              { label: 'Live Products', value: String(brand.live_products) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">{f.label}</p>
                <p className="text-parchment text-sm">{f.value ?? '—'}</p>
              </div>
            ))}
          </div>

          {actionError && <p className="text-red-400 text-xs">{actionError}</p>}

          <div className="flex gap-3 pt-1">
            {brand.status !== 'approved' && brand.status !== 'active' && (
              <button
                onClick={() => handleStatus('approved')}
                disabled={isPending}
                className="bg-gold text-ink text-xs font-medium tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {isPending ? '…' : 'Activate'}
              </button>
            )}
            {brand.status !== 'suspended' && (
              <button
                onClick={() => handleStatus('suspended')}
                disabled={isPending}
                className="border border-red-500/40 text-red-400 text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:border-red-400 transition-colors disabled:opacity-50"
              >
                {isPending ? '…' : 'Suspend'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
