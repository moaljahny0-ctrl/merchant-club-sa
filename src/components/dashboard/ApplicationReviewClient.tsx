'use client'

import { useState, useTransition } from 'react'
import { reviewApplication } from '@/lib/actions/admin'
import type { BrandApplication } from '@/lib/types/database'

const TABS = ['all', 'pending', 'approved', 'rejected'] as const
type Tab = typeof TABS[number]

function pillCls(status: string) {
  if (status === 'approved') return 'a-pill a-p-active'
  if (status === 'pending')  return 'a-pill a-p-pending'
  return 'a-pill a-p-review'
}

export function ApplicationReviewClient({ applications }: { applications: BrandApplication[] }) {
  const [filter, setFilter] = useState<Tab>('pending')

  const counts: Record<string, number> = { all: applications.length }
  for (const a of applications) counts[a.status] = (counts[a.status] ?? 0) + 1

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Applications
      </h1>

      {/* Mini stat boxes */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{applications.length}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.pending ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Pending</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--green)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.approved ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Approved</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--red)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.rejected ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Rejected</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: '14px' }}>
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
      </div>

      {/* Table */}
      <div className="a-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '11px' }}>
            No applications found
          </div>
        ) : (
          <table className="a-stat-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Brand Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <AppRow key={app.id} app={app} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px' }}>
        {filtered.length} application{filtered.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

function AppRow({ app, index }: { app: BrandApplication; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleApprove() {
    setActionError(null)
    startTransition(async () => {
      const result = await reviewApplication(app.id, 'approve')
      if (result.error) setActionError(result.error)
    })
  }

  function handleReject() {
    if (!rejectionReason.trim()) { setActionError('Rejection reason required.'); return }
    setActionError(null)
    startTransition(async () => {
      const result = await reviewApplication(app.id, 'reject', rejectionReason)
      if (result.error) setActionError(result.error)
    })
  }

  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'

  return (
    <>
      <tr className="a-trow" style={{ background: rowBg }}>
        <td style={{ color: 'var(--text)', fontWeight: 500 }}>
          {app.brand_name_en}
          {app.contact_name && (
            <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400, marginTop: '2px' }}>
              {app.contact_name}
            </div>
          )}
        </td>
        <td>{app.contact_email ?? '—'}</td>
        <td>{app.category ?? '—'}</td>
        <td>
          {new Date(app.created_at).toLocaleDateString('en-SA', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </td>
        <td>
          <span
            className={pillCls(app.status)}
            style={app.status === 'rejected' ? { background: 'var(--red-bg)', color: 'var(--red)' } : undefined}
          >
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {app.status === 'pending' ? (
              <>
                <button
                  className="a-action-btn"
                  onClick={handleApprove}
                  disabled={isPending}
                  style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? '…' : 'Approve'}
                </button>
                <button
                  className="a-action-btn"
                  onClick={() => setExpanded(true)}
                  style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)' }}
                >
                  Reject
                </button>
              </>
            ) : (
              <button
                className="a-action-btn"
                onClick={() => setExpanded(v => !v)}
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                {expanded ? 'Close' : 'View'}
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="a-tr-detail">
          <td colSpan={6} style={{ background: 'var(--bg3)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              {([
                { label: 'Phone',     value: app.contact_phone },
                { label: 'Instagram', value: app.instagram_url },
                { label: 'Website',   value: app.website_url },
                { label: 'Referral',  value: app.referral_source },
              ] as { label: string; value: string | null | undefined }[]).filter(f => f.value).map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '3px' }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text)', wordBreak: 'break-all' }}>{f.value}</div>
                </div>
              ))}
            </div>

            {app.brand_description && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px' }}>Description</div>
                <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{app.brand_description}</div>
              </div>
            )}

            {app.rejection_reason && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '4px' }}>Rejection reason</div>
                <div style={{ fontSize: '11px', color: 'var(--red)' }}>{app.rejection_reason}</div>
              </div>
            )}

            {/* Rejection form */}
            {app.status === 'pending' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>
                  Rejection reason (required)
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    style={{
                      flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '7px 12px', fontSize: '11px',
                      color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans',sans-serif",
                    }}
                  />
                  <button
                    className="a-action-btn"
                    onClick={handleReject}
                    disabled={isPending}
                    style={{ background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  >
                    {isPending ? '…' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            )}

            {actionError && (
              <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '10px' }}>{actionError}</div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
