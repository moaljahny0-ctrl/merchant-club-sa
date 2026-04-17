'use client'

import { useState, useTransition } from 'react'
import { reviewApplication } from '@/lib/actions/admin'
import type { BrandApplication } from '@/lib/types/database'

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  approved: 'text-green-400',
  rejected: 'text-red-400',
  info_requested: 'text-blue-400',
}

export function ApplicationReviewClient({ applications }: { applications: BrandApplication[] }) {
  const [filter, setFilter] = useState<string>('pending')
  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {['all', 'pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors ${
              filter === tab
                ? 'text-gold border-b border-gold'
                : 'text-muted hover:text-parchment'
            }`}
          >
            {tab} {tab !== 'all' && `(${applications.filter(a => a.status === tab).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No applications.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application: app }: { application: BrandApplication }) {
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
    if (!rejectionReason.trim()) {
      setActionError('Please provide a rejection reason.')
      return
    }
    setActionError(null)
    startTransition(async () => {
      const result = await reviewApplication(app.id, 'reject', rejectionReason)
      if (result.error) setActionError(result.error)
    })
  }

  return (
    <div className="border border-border bg-surface">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <p className="text-parchment text-sm font-medium truncate">{app.brand_name_en}</p>
            <p className="text-muted text-xs mt-0.5">{app.contact_name} · {app.contact_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <span className={`text-xs ${STATUS_COLORS[app.status] ?? 'text-muted'}`}>{app.status}</span>
          <span className="text-muted text-xs">
            {new Date(app.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short' })}
          </span>
          <span className="text-muted">{expanded ? '↑' : '↓'}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Category', value: app.category },
              { label: 'Phone', value: app.contact_phone },
              { label: 'Instagram', value: app.instagram_url },
              { label: 'Website', value: app.website_url },
              { label: 'Referral', value: app.referral_source },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">{f.label}</p>
                <p className="text-parchment text-sm break-all">{f.value}</p>
              </div>
            ))}
          </div>

          {app.brand_description && (
            <div>
              <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Description</p>
              <p className="text-parchment text-sm whitespace-pre-wrap leading-relaxed">{app.brand_description}</p>
            </div>
          )}

          {app.rejection_reason && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
              <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Rejection reason</p>
              <p className="text-red-400 text-sm">{app.rejection_reason}</p>
            </div>
          )}

          {actionError && (
            <p className="text-red-400 text-xs">{actionError}</p>
          )}

          {app.status === 'pending' && (
            <div className="flex flex-col gap-3 pt-2">
              <div>
                <label className="block text-[9px] text-muted tracking-[0.2em] uppercase mb-2">
                  Rejection reason (required to reject)
                </label>
                <input
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full bg-ink border border-border text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors"
                  placeholder="Reason for rejection…"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isPending}
                  className="bg-gold text-ink text-xs font-medium tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isPending ? '…' : 'Approve'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isPending}
                  className="border border-red-500/40 text-red-400 text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:border-red-400 transition-colors disabled:opacity-50"
                >
                  {isPending ? '…' : 'Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
