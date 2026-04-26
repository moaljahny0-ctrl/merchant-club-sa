'use client'

import { useState, useTransition } from 'react'
import { adminReviewProduct, adminUnpublishProduct, adminDeleteProduct } from '@/lib/actions/admin'
import type { Product } from '@/lib/types/database'

type ProductImage = { url: string; is_primary: boolean; sort_order: number }
type ProductWithBrand = Product & {
  brands?: { name_en: string } | null
  product_images?: ProductImage[]
}

const TABS = ['all', 'submitted', 'live', 'rejected'] as const
type Tab = typeof TABS[number]

function pillCls(status: string) {
  if (status === 'live')      return 'a-pill a-p-active'
  if (status === 'submitted') return 'a-pill a-p-pending'
  return 'a-pill a-p-review'
}

export function ProductReviewClient({ products }: { products: ProductWithBrand[] }) {
  const [filter, setFilter] = useState<Tab>('submitted')

  const counts: Record<string, number> = { all: products.length }
  for (const p of products) counts[p.status] = (counts[p.status] ?? 0) + 1

  const filtered = filter === 'all' ? products : products.filter(p => p.status === filter)

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Product Review
      </h1>

      {/* Mini stat boxes */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{products.length}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--green)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.live ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Live</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.submitted ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Submitted</div>
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
            No products found
          </div>
        ) : (
          <table className="a-stat-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <ProductRow key={product.id} product={product} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px' }}>
        {filtered.length} product{filtered.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

function ProductRow({ product, index }: { product: ProductWithBrand; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleApprove() {
    setActionError(null)
    startTransition(async () => {
      const result = await adminReviewProduct(product.id, 'approve')
      if (result.error) setActionError(result.error)
    })
  }

  function handleReject() {
    if (!rejectionReason.trim()) { setActionError('Rejection reason required.'); return }
    setActionError(null)
    startTransition(async () => {
      const result = await adminReviewProduct(product.id, 'reject', rejectionReason)
      if (result.error) setActionError(result.error)
    })
  }

  function handleUnpublish() {
    if (!confirm('Unpublish this product? It will be hidden from the storefront.')) return
    setActionError(null)
    startTransition(async () => {
      const result = await adminUnpublishProduct(product.id)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm('Permanently delete this product and its images? This cannot be undone.')) return
    setActionError(null)
    startTransition(async () => {
      const result = await adminDeleteProduct(product.id)
      if (result.error) setActionError(result.error)
    })
  }

  const brandName = product.brands?.name_en ?? '—'
  const primaryImage = product.product_images?.find(img => img.is_primary) ?? product.product_images?.[0]
  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'

  return (
    <>
      <tr className="a-trow" style={{ background: rowBg }}>
        {/* Product column: thumbnail + name */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage.url}
                alt={product.title_en}
                style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                📦
              </div>
            )}
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '11px' }}>{product.title_en}</div>
              {product.title_ar && (
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{product.title_ar}</div>
              )}
            </div>
          </div>
        </td>
        <td>{brandName}</td>
        <td>{product.category ?? '—'}</td>
        <td>SAR {Number(product.price).toFixed(2)}</td>
        <td>
          <span
            className={pillCls(product.status)}
            style={product.status === 'rejected' ? { background: 'var(--red-bg)', color: 'var(--red)' } : undefined}
          >
            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          </span>
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
            {product.status === 'submitted' && (
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
            )}
            {product.status === 'live' && (
              <button
                className="a-action-btn"
                onClick={handleUnpublish}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--gold-bg)', borderColor: 'var(--gold)', color: 'var(--gold)', opacity: isPending ? 0.5 : 1 }}
              >
                Unpublish
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="a-tr-detail">
          <td colSpan={6} style={{ background: 'var(--bg3)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            {/* Images */}
            {product.product_images && product.product_images.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>Images</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[...product.product_images]
                    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order)
                    .map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`Image ${i + 1}`}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', display: 'block' }}
                        />
                        {img.is_primary && (
                          <span style={{ position: 'absolute', top: '3px', left: '3px', background: 'var(--gold)', color: '#1a1208', fontSize: '8px', padding: '1px 4px', borderRadius: '3px' }}>
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              {[
                { label: 'SKU',     value: product.sku },
                { label: 'Stock',   value: String(product.stock_quantity) },
                { label: 'Updated', value: new Date(product.updated_at).toLocaleDateString('en-SA') },
                { label: 'Brand',   value: brandName },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '3px' }}>{f.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text)' }}>{f.value ?? '—'}</div>
                </div>
              ))}
            </div>

            {product.description_en && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px' }}>Description (EN)</div>
                <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{product.description_en}</div>
              </div>
            )}

            {product.description_ar && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px' }}>Description (AR)</div>
                <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', direction: 'rtl' }}>{product.description_ar}</div>
              </div>
            )}

            {product.rejection_reason && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '4px' }}>Previous rejection reason</div>
                <div style={{ fontSize: '11px', color: 'var(--red)' }}>{product.rejection_reason}</div>
              </div>
            )}

            {/* Rejection form for submitted */}
            {product.status === 'submitted' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>
                  Rejection reason (required to reject)
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

            {/* Admin controls */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {product.status !== 'submitted' && (
                <button
                  className="a-action-btn"
                  onClick={handleApprove}
                  disabled={isPending}
                  style={{ background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? '…' : 'Approve / Set Live'}
                </button>
              )}
              {product.status === 'live' && (
                <button
                  className="a-action-btn"
                  onClick={handleUnpublish}
                  disabled={isPending}
                  style={{ opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? '…' : 'Unpublish'}
                </button>
              )}
              <button
                className="a-action-btn"
                onClick={handleDelete}
                disabled={isPending}
                style={{ background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', marginLeft: 'auto', opacity: isPending ? 0.5 : 1 }}
              >
                {isPending ? '…' : 'Delete'}
              </button>
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
