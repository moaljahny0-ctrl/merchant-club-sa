'use client'

import { useState, useTransition } from 'react'
import { adminModerateReview, adminDeleteReview } from '@/lib/actions/admin-reviews'

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  products?: { title_en: string } | { title_en: string }[] | null
  customers?: { full_name: string; email: string } | { full_name: string; email: string }[] | null
}

const TABS = ['pending', 'approved', 'rejected', 'all'] as const
type Tab = typeof TABS[number]

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function stars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function pillCls(status: string) {
  if (status === 'approved') return 'a-pill a-p-active'
  if (status === 'pending') return 'a-pill a-p-pending'
  return 'a-pill a-p-review'
}

export function ReviewsClient({ reviews }: { reviews: ReviewRow[] }) {
  const [filter, setFilter] = useState<Tab>('pending')

  const counts: Record<Tab, number> = {
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    all: reviews.length,
  }

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter)

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Reviews
      </h1>

      <div style={{ marginBottom: '14px' }}>
        <div className="a-tab-row">
          {TABS.map(tab => (
            <button key={tab} className={`a-tab${filter === tab ? ' a-tab-active' : ''}`} onClick={() => setFilter(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {counts[tab] > 0 && (
                <span style={{
                  marginLeft: '5px', fontSize: '12px', padding: '1px 5px', borderRadius: '8px',
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

      <div className="a-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '14px' }}>
            No reviews found
          </div>
        ) : (
          <table className="a-stat-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((review, i) => (
                <ReviewRow key={review.id} review={review} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '10px' }}>
        {filtered.length} review{filtered.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

function ReviewRow({ review, index }: { review: ReviewRow; index: number }) {
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'

  const product = one(review.products)
  const customer = one(review.customers)

  function handleModerate(action: 'approve' | 'reject') {
    setActionError(null)
    startTransition(async () => {
      const result = await adminModerateReview(review.id, action)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm('Permanently delete this review?')) return
    setActionError(null)
    startTransition(async () => {
      const result = await adminDeleteReview(review.id)
      if (result.error) setActionError(result.error)
    })
  }

  return (
    <tr className="a-trow" style={{ background: rowBg }}>
      <td>{product?.title_en ?? '—'}</td>
      <td>
        <div style={{ fontSize: '14px', color: 'var(--text)' }}>{customer?.full_name ?? '—'}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{customer?.email ?? ''}</div>
      </td>
      <td style={{ color: 'var(--gold)', letterSpacing: '1px' }}>{stars(review.rating)}</td>
      <td style={{ maxWidth: '280px', fontSize: '13px', color: 'var(--text2, var(--text))' }}>{review.comment ?? '—'}</td>
      <td>
        <span className={pillCls(review.status)}>{review.status.charAt(0).toUpperCase() + review.status.slice(1)}</span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {review.status !== 'approved' && (
            <button
              className="a-action-btn"
              onClick={() => handleModerate('approve')}
              disabled={isPending}
              style={{ padding: '4px 10px', fontSize: '13px', background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
            >
              Approve
            </button>
          )}
          {review.status !== 'rejected' && (
            <button
              className="a-action-btn"
              onClick={() => handleModerate('reject')}
              disabled={isPending}
              style={{ padding: '4px 10px', fontSize: '13px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1 }}
            >
              Reject
            </button>
          )}
          <button
            className="a-action-btn"
            onClick={handleDelete}
            disabled={isPending}
            style={{ padding: '4px 10px', fontSize: '13px', opacity: isPending ? 0.5 : 1 }}
          >
            Delete
          </button>
        </div>
        {actionError && <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{actionError}</div>}
      </td>
    </tr>
  )
}
