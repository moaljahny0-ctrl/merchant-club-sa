'use client'

import { useState, useTransition } from 'react'
import { adminCreateDiscount, adminToggleDiscountActive, adminDeleteDiscount } from '@/lib/actions/admin-discounts'
import type { DiscountCode, DiscountType } from '@/lib/types/database'

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '8px 12px', fontSize: '14px',
  color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const labelStyle: React.CSSProperties = {
  fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', display: 'block',
}

export function DiscountsClient({ discounts }: { discounts: DiscountCode[] }) {
  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
        Discounts
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '18px', maxWidth: '640px' }}>
        Codes can be created and managed here now. Applying them at checkout is not yet wired in — payment is still test-mode pending real Moyasar keys, so that integration is intentionally deferred.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '18px', alignItems: 'start' }}>
        <NewDiscountForm />
        <DiscountTable discounts={discounts} />
      </div>
    </>
  )
}

function NewDiscountForm() {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<DiscountType>('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [maxUses, setMaxUses] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    const v = parseFloat(value)
    const min = parseFloat(minOrder) || 0
    const max = maxUses.trim() ? parseInt(maxUses, 10) : null
    if (Number.isNaN(v)) { setError('Enter a valid value.'); return }
    setError(null)
    startTransition(async () => {
      const result = await adminCreateDiscount({ code, description, discount_type: type, value: v, min_order_amount: min, max_uses: max })
      if (result.error) {
        setError(result.error)
      } else {
        setCode(''); setDescription(''); setValue(''); setMinOrder('0'); setMaxUses('')
      }
    })
  }

  return (
    <div className="a-chart-card">
      <div className="a-card-title" style={{ marginBottom: '14px' }}>New Discount Code</div>

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '6px', padding: '8px 10px', marginBottom: '12px', fontSize: '13px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Code</label>
        <input style={{ ...fieldStyle, textTransform: 'uppercase' }} value={code} onChange={e => setCode(e.target.value)} placeholder="SUMMER10" />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Description</label>
        <input style={fieldStyle} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select style={fieldStyle} value={type} onChange={e => setType(e.target.value as DiscountType)}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed (SAR)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Value</label>
          <input style={fieldStyle} value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'percent' ? '10' : '50'} />
        </div>
      </div>
      <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Min Order (SAR)</label>
          <input style={fieldStyle} value={minOrder} onChange={e => setMinOrder(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Max Uses</label>
          <input style={fieldStyle} value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Unlimited" />
        </div>
      </div>

      <button
        className="a-action-btn a-primary"
        onClick={handleCreate}
        disabled={isPending || !code.trim() || !value.trim()}
        style={{ opacity: isPending || !code.trim() || !value.trim() ? 0.5 : 1, width: '100%' }}
      >
        {isPending ? 'Creating…' : 'Create Code'}
      </button>
    </div>
  )
}

function DiscountTable({ discounts }: { discounts: DiscountCode[] }) {
  if (discounts.length === 0) {
    return (
      <div className="a-chart-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '14px' }}>
        No discount codes yet
      </div>
    )
  }

  return (
    <div className="a-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="a-stat-table" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((d, i) => <DiscountRow key={d.id} discount={d} index={i} />)}
        </tbody>
      </table>
    </div>
  )
}

function DiscountRow({ discount, index }: { discount: DiscountCode; index: number }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await adminToggleDiscountActive(discount.id, !discount.active)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete discount code "${discount.code}"?`)) return
    setError(null)
    startTransition(async () => {
      const result = await adminDeleteDiscount(discount.id)
      if (result.error) setError(result.error)
    })
  }

  return (
    <tr className="a-trow" style={{ background: rowBg }}>
      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{discount.code}</td>
      <td>{discount.discount_type === 'percent' ? 'Percent' : 'Fixed'}</td>
      <td>{discount.discount_type === 'percent' ? `${discount.value}%` : `SAR ${discount.value}`}</td>
      <td>SAR {discount.min_order_amount}</td>
      <td>{discount.used_count}{discount.max_uses !== null ? ` / ${discount.max_uses}` : ''}</td>
      <td>
        <span className="a-pill" style={discount.active ? { background: 'var(--green-bg)', color: 'var(--green)' } : { background: 'var(--border2)', color: 'var(--text3)' }}>
          {discount.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button className="a-action-btn" onClick={handleToggle} disabled={isPending} style={{ padding: '4px 10px', fontSize: '13px', opacity: isPending ? 0.5 : 1 }}>
            {discount.active ? 'Deactivate' : 'Activate'}
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
        {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{error}</div>}
      </td>
    </tr>
  )
}
