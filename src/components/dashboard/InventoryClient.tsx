'use client'

import { useState, useTransition } from 'react'
import { adminUpdateStock, adminToggleTrackInventory } from '@/lib/actions/admin-inventory'

type InventoryProduct = {
  id: string
  title_en: string
  title_ar: string | null
  sku: string | null
  status: string
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  brands?: { name_en: string } | { name_en: string }[] | null
}

function brandName(p: InventoryProduct): string {
  const b = p.brands
  if (!b) return '—'
  return (Array.isArray(b) ? b[0]?.name_en : b.name_en) ?? '—'
}

const TABS = ['all', 'low', 'out', 'untracked'] as const
type Tab = typeof TABS[number]

const TAB_LABEL: Record<Tab, string> = {
  all: 'All',
  low: 'Low Stock',
  out: 'Out of Stock',
  untracked: 'Not Tracked',
}

function isLow(p: InventoryProduct) {
  return p.track_inventory && p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
}
function isOut(p: InventoryProduct) {
  return p.track_inventory && p.stock_quantity <= 0
}

export function InventoryClient({ products }: { products: InventoryProduct[] }) {
  const [filter, setFilter] = useState<Tab>('all')

  const counts: Record<Tab, number> = {
    all: products.length,
    low: products.filter(isLow).length,
    out: products.filter(isOut).length,
    untracked: products.filter(p => !p.track_inventory).length,
  }

  const filtered = products.filter(p => {
    if (filter === 'low') return isLow(p)
    if (filter === 'out') return isOut(p)
    if (filter === 'untracked') return !p.track_inventory
    return true
  })

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Inventory
      </h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.all}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.low}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Low Stock</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--red)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.out}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Out of Stock</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--border2)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.untracked}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Not Tracked</div>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div className="a-tab-row">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`a-tab${filter === tab ? ' a-tab-active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {TAB_LABEL[tab]}
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
            No products found
          </div>
        ) : (
          <table className="a-stat-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Low Stock At</th>
                <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <InventoryRow key={product.id} product={product} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '10px' }}>
        {filtered.length} product{filtered.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

function InventoryRow({ product, index }: { product: InventoryProduct; index: number }) {
  const [editing, setEditing] = useState(false)
  const [stockInput, setStockInput] = useState(String(product.stock_quantity))
  const [thresholdInput, setThresholdInput] = useState(String(product.low_stock_threshold))
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'
  const low = isLow(product)
  const out = isOut(product)

  function handleSaveStock() {
    const stock = parseInt(stockInput, 10)
    const threshold = parseInt(thresholdInput, 10)
    if (Number.isNaN(stock) || Number.isNaN(threshold)) {
      setActionError('Enter valid numbers.')
      return
    }
    setActionError(null)
    startTransition(async () => {
      const result = await adminUpdateStock(product.id, stock, threshold)
      if (result.error) setActionError(result.error)
      else setEditing(false)
    })
  }

  function handleToggleTracking() {
    setActionError(null)
    startTransition(async () => {
      const result = await adminToggleTrackInventory(product.id, !product.track_inventory)
      if (result.error) setActionError(result.error)
    })
  }

  return (
    <>
      <tr className="a-trow" style={{ background: rowBg }}>
        <td>
          <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '14px' }}>{product.title_en}</div>
          {product.title_ar && (
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '1px' }}>{product.title_ar}</div>
          )}
        </td>
        <td>{brandName(product)}</td>
        <td>{product.sku ?? '—'}</td>
        <td>
          {editing ? (
            <input
              value={stockInput}
              onChange={e => setStockInput(e.target.value)}
              style={{ width: '64px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '4px 8px', fontSize: '13px', color: 'var(--text)', outline: 'none' }}
            />
          ) : (
            <span style={out ? { color: 'var(--red)', fontWeight: 600 } : low ? { color: 'var(--gold)', fontWeight: 600 } : undefined}>
              {product.stock_quantity}
            </span>
          )}
        </td>
        <td>
          {editing ? (
            <input
              value={thresholdInput}
              onChange={e => setThresholdInput(e.target.value)}
              style={{ width: '64px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '4px 8px', fontSize: '13px', color: 'var(--text)', outline: 'none' }}
            />
          ) : (
            product.low_stock_threshold
          )}
        </td>
        <td>
          <span
            className="a-pill"
            style={product.track_inventory ? { background: 'var(--green-bg)', color: 'var(--green)' } : { background: 'var(--border2)', color: 'var(--text3)' }}
          >
            {product.track_inventory ? 'Tracked' : 'Off'}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {editing ? (
              <>
                <button
                  className="a-action-btn"
                  onClick={handleSaveStock}
                  disabled={isPending}
                  style={{ padding: '4px 10px', fontSize: '13px', background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? '…' : 'Save'}
                </button>
                <button
                  className="a-action-btn"
                  onClick={() => { setEditing(false); setStockInput(String(product.stock_quantity)); setThresholdInput(String(product.low_stock_threshold)) }}
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="a-action-btn"
                  onClick={() => setEditing(true)}
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                >
                  Edit
                </button>
                <button
                  className="a-action-btn"
                  onClick={handleToggleTracking}
                  disabled={isPending}
                  style={{ padding: '4px 10px', fontSize: '13px', opacity: isPending ? 0.5 : 1 }}
                >
                  {product.track_inventory ? 'Stop Tracking' : 'Track'}
                </button>
              </>
            )}
          </div>
          {actionError && (
            <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{actionError}</div>
          )}
        </td>
      </tr>
    </>
  )
}
