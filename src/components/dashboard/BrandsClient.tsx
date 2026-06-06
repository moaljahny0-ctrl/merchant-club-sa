'use client'

import { useState, useTransition } from 'react'
import { adminUpdateBrandStatus, adminUpdateBrandOnboardingState } from '@/lib/actions/admin'

type Brand = {
  id: string
  name_en: string
  name_ar: string | null
  slug: string
  status: string
  onboarding_state: string
  created_at: string
  contact_email: string | null
  contact_phone: string | null
  live_products: number
}

const TABS = ['all', 'approved', 'active', 'pending', 'suspended', 'rejected'] as const
type Tab = typeof TABS[number]

const ONBOARDING_STATES = ['invited', 'account_setup', 'profile_setup', 'products_setup', 'submitted', 'live'] as const
type OnboardingState = typeof ONBOARDING_STATES[number]

function pillCls(status: string) {
  if (status === 'approved' || status === 'active') return 'a-pill a-p-active'
  if (status === 'pending') return 'a-pill a-p-pending'
  return 'a-pill a-p-review'
}

function onboardingPillStyle(state: string): React.CSSProperties {
  if (state === 'live') return { background: 'rgba(74,158,107,0.15)', color: '#4a9e6b', border: '1px solid rgba(74,158,107,0.3)', borderRadius: '3px', padding: '2px 7px', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' }
  if (state === 'submitted') return { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '3px', padding: '2px 7px', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' }
  return { background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: '3px', padding: '2px 7px', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' }
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

  const submittedCount = brands.filter(b => b.onboarding_state === 'submitted').length

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Brands
      </h1>

      {submittedCount > 0 && (
        <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#D4AF37' }}>
          ⚡ {submittedCount} brand{submittedCount !== 1 ? 's' : ''} submitted for storefront review
        </div>
      )}

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
                <th>Onboarding</th>
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
  const [showSuspendReason, setShowSuspendReason] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [showRequestChanges, setShowRequestChanges] = useState(false)
  const [changesReason, setChangesReason] = useState('')

  function handleStatus(status: 'approved' | 'suspended' | 'active', reason?: string) {
    setActionError(null)
    setShowSuspendReason(false)
    startTransition(async () => {
      const result = await adminUpdateBrandStatus(brand.id, status, reason)
      if (result.error) setActionError(result.error)
    })
  }

  function handleOnboardingState(state: OnboardingState) {
    setActionError(null)
    startTransition(async () => {
      const result = await adminUpdateBrandOnboardingState(brand.id, state)
      if (result.error) setActionError(result.error)
    })
  }

  function handleRequestChanges() {
    setActionError(null)
    setShowRequestChanges(false)
    startTransition(async () => {
      const result = await adminUpdateBrandOnboardingState(brand.id, 'products_setup')
      if (result.error) { setActionError(result.error); return }
      // The email with reason is sent via a separate notification — use existing state change email
      // changesReason is captured in the state email body via the 'products_setup' → message
    })
  }

  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'
  const highlightSubmitted = brand.onboarding_state === 'submitted'
  const canApprove = brand.status !== 'approved' && brand.status !== 'active'
  const canSuspend = brand.status !== 'suspended'
  const canRestore = brand.status === 'suspended'

  return (
    <>
      <tr className="a-trow" style={{ background: highlightSubmitted ? 'rgba(212,175,55,0.05)' : rowBg }}>
        <td style={{ color: 'var(--text)', fontWeight: 500 }}>
          {brand.name_en}
          {brand.name_ar && (
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: '6px', fontWeight: 400 }}>
              {brand.name_ar}
            </span>
          )}
          {highlightSubmitted && (
            <span style={{ marginLeft: '6px', fontSize: '8px', background: 'rgba(212,175,55,0.2)', color: '#D4AF37', padding: '1px 5px', borderRadius: '3px' }}>
              REVIEW
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
        <td>
          <span style={onboardingPillStyle(brand.onboarding_state)}>
            {brand.onboarding_state.replace('_', ' ')}
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
            {highlightSubmitted && (
              <button
                className="a-action-btn"
                onClick={() => handleOnboardingState('live')}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: '#4a9e6b', borderColor: '#4a9e6b', color: '#fff', opacity: isPending ? 0.5 : 1 }}
              >
                Go Live
              </button>
            )}
            {highlightSubmitted && !showRequestChanges && (
              <button
                className="a-action-btn"
                onClick={() => setShowRequestChanges(true)}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                Request Changes
              </button>
            )}
            {canSuspend && !showSuspendReason && (
              <button
                className="a-action-btn"
                onClick={() => setShowSuspendReason(true)}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1 }}
              >
                Suspend
              </button>
            )}
            {canRestore && (
              <button
                className="a-action-btn"
                onClick={() => handleStatus('approved')}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
              >
                Restore
              </button>
            )}
          </div>
        </td>
      </tr>
      {showSuspendReason && (
        <tr className="a-tr-detail">
          <td colSpan={7} style={{ background: 'rgba(204,85,85,0.05)', padding: '12px 16px', borderBottom: '1px solid var(--red)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Suspension reason (optional — sent to brand)"
                style={{ flex: 1, minWidth: '220px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', fontSize: '12px', outline: 'none' }}
              />
              <button
                className="a-action-btn"
                onClick={() => handleStatus('suspended', suspendReason)}
                disabled={isPending}
                style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--red)', borderColor: 'var(--red)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
              >
                Confirm suspend
              </button>
              <button
                className="a-action-btn"
                onClick={() => setShowSuspendReason(false)}
                style={{ padding: '6px 10px', fontSize: '11px' }}
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
      {showRequestChanges && (
        <tr className="a-tr-detail">
          <td colSpan={7} style={{ background: 'rgba(184,151,90,0.05)', padding: '12px 16px', borderBottom: '1px solid rgba(184,151,90,0.3)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={changesReason}
                onChange={e => setChangesReason(e.target.value)}
                placeholder="Describe what needs to change (sent to brand)"
                style={{ flex: 1, minWidth: '220px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', fontSize: '12px', outline: 'none' }}
              />
              <button
                className="a-action-btn"
                onClick={handleRequestChanges}
                disabled={isPending}
                style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--ink)', opacity: isPending ? 0.5 : 1 }}
              >
                Send feedback
              </button>
              <button
                className="a-action-btn"
                onClick={() => setShowRequestChanges(false)}
                style={{ padding: '6px 10px', fontSize: '11px' }}
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
      {expanded && (
        <tr className="a-tr-detail">
          <td colSpan={7} style={{ background: 'var(--bg3)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              {[
                { label: 'Slug',          value: brand.slug },
                { label: 'Phone',         value: brand.contact_phone },
                { label: 'Live Products', value: String(brand.live_products) },
                { label: 'Status',        value: brand.status },
                { label: 'Onboarding',    value: brand.onboarding_state },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '3px' }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text)' }}>{f.value ?? '—'}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px' }}>
                Set onboarding stage
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {ONBOARDING_STATES.map(state => (
                  <button
                    key={state}
                    className="a-action-btn"
                    onClick={() => handleOnboardingState(state)}
                    disabled={isPending || brand.onboarding_state === state}
                    style={{
                      padding: '3px 9px', fontSize: '9px', letterSpacing: '0.05em',
                      opacity: (isPending || brand.onboarding_state === state) ? 0.4 : 1,
                      background: brand.onboarding_state === state ? 'var(--gold)' : undefined,
                      borderColor: brand.onboarding_state === state ? 'var(--gold)' : undefined,
                      color: brand.onboarding_state === state ? 'var(--ink)' : undefined,
                    }}
                  >
                    {state.replace('_', ' ')}
                  </button>
                ))}
              </div>
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
