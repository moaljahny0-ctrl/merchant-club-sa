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

const TABS = ['all', 'approved', 'active', 'pending', 'suspended', 'rejected'] as const
type Tab = typeof TABS[number]

function pillCls(status: string) {
  if (status === 'approved' || status === 'active') return 'a-pill a-p-active'
  if (status === 'pending') return 'a-pill a-p-pending'
  return 'a-pill a-p-review'
}

export function BrandsClient({ brands }: { brands: Brand[] }) {
  const [filter, setFilter] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const counts: Record<string, number> = { all: brands.length }
  for (const b of brands) counts[b.status] = (counts[b.status] ?? 0) + 1

  const filtered = brands.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false
    if (search && !b.name_en.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Brands
      </h1>

      {/* Mini stat boxes */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{brands.length}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--green)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{(counts.approved ?? 0) + (counts.active ?? 0)}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Approved</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--red)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.suspended ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Suspended</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.pending ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Pending</div>
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
        <div className="a-tab-row">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`a-tab${filter === tab ? ' a-tab-active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {(counts[tab] ?? 0) > 0 && (
                <span style={{
                  marginLeft: '5px', fontSize: '9px', padding: '1px 5px', borderRadius: '8px',
                  background: filter === tab ? 'rgba(184,151,90,0.3)' : 'var(--border2)',
                  color: filter === tab ? 'var(--gold)' : 'var(--text3)',
                }}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="a-search-bar" style={{ minWidth: '200px' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, color: 'var(--text3)' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="a-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brands…"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Table */}
      <div className="a-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '11px' }}>
            No brands found
          </div>
        ) : (
          <table className="a-stat-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Email</th>
                <th>Status</th>
                <th>Products</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((brand, i) => (
                <BrandRow key={brand.id} brand={brand} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px' }}>
        {filtered.length} brand{filtered.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

function BrandRow({ brand, index }: { brand: Brand; index: number }) {
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

  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'
  const canApprove = brand.status !== 'approved' && brand.status !== 'active'
  const canSuspend = brand.status !== 'suspended'

  return (
    <>
      <tr className="a-trow" style={{ background: rowBg }}>
        <td style={{ color: 'var(--text)', fontWeight: 500 }}>
          {brand.name_en}
          {brand.name_ar && (
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: '6px', fontWeight: 400 }}>
              {brand.name_ar}
            </span>
          )}
        </td>
        <td>{brand.contact_email ?? '—'}</td>
        <td>
          <span
            className={pillCls(brand.status)}
            style={brand.status === 'suspended' ? { background: 'var(--red-bg)', color: 'var(--red)' } : undefined}
          >
            {brand.status.charAt(0).toUpperCase() + brand.status.slice(1)}
          </span>
        </td>
        <td>{brand.live_products}</td>
        <td>
          {new Date(brand.created_at).toLocaleDateString('en-SA', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </td>
        <td>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <button
              className="a-action-btn"
              onClick={() => setExpanded(v => !v)}
              style={{ padding: '4px 10px', fontSize: '10px' }}
            >
              {expanded ? 'Close' : 'View'}
            </button>
            {canApprove && (
              <button
                className="a-action-btn"
                onClick={() => handleStatus('approved')}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
              >
                Approve
              </button>
            )}
            {canSuspend && (
              <button
                className="a-action-btn"
                onClick={() => handleStatus('suspended')}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1 }}
              >
                Suspend
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="a-tr-detail">
          <td colSpan={6} style={{ background: 'var(--bg3)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Slug',          value: brand.slug },
                { label: 'Phone',         value: brand.contact_phone },
                { label: 'Live Products', value: String(brand.live_products) },
                { label: 'Status',        value: brand.status },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '3px' }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text)' }}>{f.value ?? '—'}</div>
                </div>
              ))}
            </div>
            {actionError && (
              <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '10px' }}>{actionError}</div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
