'use client'

import { useMemo, useState } from 'react'
import { DonutCard, type DonutDatum } from './AdminCharts'

type OrderItemRow = { product_id: string; title: string; quantity: number; total: number }

type OrderRow = {
  id: string
  order_number: string
  brand_id: string
  subtotal: number
  status: string
  items: unknown
  created_at: string
  brands: { name_en: string } | { name_en: string }[] | null
}

const NON_REVENUE_STATUSES = ['cancelled', 'refunded']
const RANGES = [7, 30, 90] as const
type Range = typeof RANGES[number]

function brandNameOf(row: OrderRow): string {
  const b = row.brands
  const single = Array.isArray(b) ? b[0] : b
  return single?.name_en ?? 'Unknown'
}

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function ReportsClient({ orders }: { orders: OrderRow[] }) {
  const [range, setRange] = useState<Range>(30)
  const [now] = useState(() => Date.now())

  const filtered = useMemo(() => {
    const cutoff = now - range * 86400000
    return orders.filter(o => new Date(o.created_at).getTime() >= cutoff)
  }, [orders, range, now])

  const revenue = filtered
    .filter(o => !NON_REVENUE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0)
  const orderCount = filtered.length
  const completedCount = filtered.filter(o => !NON_REVENUE_STATUSES.includes(o.status)).length
  const aov = completedCount > 0 ? revenue / completedCount : 0

  const statusData: DonutDatum[] = useMemo(() => {
    const buckets: Record<string, number> = {}
    for (const o of filtered) {
      const label = o.status.charAt(0).toUpperCase() + o.status.slice(1)
      buckets[label] = (buckets[label] ?? 0) + 1
    }
    return Object.entries(buckets).map(([label, value]) => ({ label, value }))
  }, [filtered])

  const brandData: DonutDatum[] = useMemo(() => {
    const byBrand: Record<string, { name: string; value: number }> = {}
    for (const o of filtered) {
      if (NON_REVENUE_STATUSES.includes(o.status)) continue
      if (!byBrand[o.brand_id]) byBrand[o.brand_id] = { name: brandNameOf(o), value: 0 }
      byBrand[o.brand_id].value += Number(o.subtotal ?? 0)
    }
    const sorted = Object.values(byBrand).sort((a, b) => b.value - a.value)
    const top = sorted.slice(0, 4).map(b => ({ label: b.name, value: Math.round(b.value) }))
    const othersTotal = sorted.slice(4).reduce((s, b) => s + b.value, 0)
    if (othersTotal > 0) top.push({ label: 'Others', value: Math.round(othersTotal) })
    return top
  }, [filtered])

  const topProducts = useMemo(() => {
    const byProduct: Record<string, { title: string; qty: number; revenue: number }> = {}
    for (const o of filtered) {
      if (NON_REVENUE_STATUSES.includes(o.status)) continue
      const items = Array.isArray(o.items) ? (o.items as OrderItemRow[]) : []
      for (const item of items) {
        if (!item?.product_id) continue
        if (!byProduct[item.product_id]) byProduct[item.product_id] = { title: item.title ?? 'Unknown product', qty: 0, revenue: 0 }
        byProduct[item.product_id].qty += Number(item.quantity ?? 0)
        byProduct[item.product_id].revenue += Number(item.total ?? 0)
      }
    }
    return Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [filtered])

  const sar = (v: number) => `SAR ${Math.round(v).toLocaleString()}`

  function handleExportCsv() {
    const header = ['Order Number', 'Brand', 'Status', 'Subtotal', 'Created At']
    const rows = filtered.map(o => [o.order_number, brandNameOf(o), o.status, o.subtotal, o.created_at])
    const csv = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-report-${range}d-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Reports
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="a-tab-row">
            {RANGES.map(r => (
              <button key={r} className={`a-tab${range === r ? ' a-tab-active' : ''}`} onClick={() => setRange(r)}>
                {r}d
              </button>
            ))}
          </div>
          <button className="a-action-btn" onClick={handleExportCsv}>↓ Export CSV</button>
        </div>
      </div>

      <div className="a-stat-grid">
        <div className="a-stat-card a-s1">
          <div className="a-stat-icon">💰</div>
          <div className="a-stat-val">{sar(revenue)}</div>
          <div className="a-stat-lbl">Total Sales</div>
        </div>
        <div className="a-stat-card a-s2">
          <div className="a-stat-icon">🛍</div>
          <div className="a-stat-val">{orderCount}</div>
          <div className="a-stat-lbl">Orders</div>
        </div>
        <div className="a-stat-card a-s3">
          <div className="a-stat-icon">📈</div>
          <div className="a-stat-val">{sar(aov)}</div>
          <div className="a-stat-lbl">Average Order Value</div>
        </div>
      </div>

      <div className="a-row-even3">
        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Top Products by Revenue</div>
              <div className="a-card-sub">Last {range} days</div>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>No sales in this range</span>
            </div>
          ) : (
            <table className="a-stat-table" style={{ marginTop: 0 }}>
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i}><td>{p.title}</td><td>{p.qty}</td><td>{sar(p.revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DonutCard title="Orders by Status" subtitle={`Last ${range} days`} data={statusData} emptyLabel="No orders" />
        <DonutCard title="Sales by Brand" subtitle={`Last ${range} days`} data={brandData} emptyLabel="No sales" valueKind="currency" />
      </div>
    </>
  )
}
