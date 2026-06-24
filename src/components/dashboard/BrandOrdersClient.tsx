'use client'

import { useState, useTransition } from 'react'
import { brandUpdateOrderStatus } from '@/lib/actions/orders'
import type { Order, OrderStatus } from '@/lib/types/database'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

export type OrderRow = Pick<Order,
  | 'id' | 'order_number' | 'customer_name' | 'customer_email' | 'customer_phone'
  | 'delivery_address' | 'subtotal' | 'status' | 'created_at' | 'tracking_number'
  | 'items' | 'brand_notes' | 'creator_link_id'
> & {
  creator_links?: { link_code: string; commission_rate: number } | null
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
    fulfilling: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shipped:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    delivered:  'bg-green-500/10 text-green-400 border-green-500/20',
    completed:  'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled:  'bg-surface text-muted border-border',
    refunded:   'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return map[status] ?? 'bg-surface text-muted border-border'
}

const TABS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
type Tab = typeof TABS[number]

function OrderRowItem({ order, index, locale }: { order: OrderRow; index: number; locale: DashLang }) {
  const [expanded, setExpanded] = useState(false)
  const [trackingInput, setTrackingInput] = useState(order.tracking_number ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const t = dt(locale).orders

  const status = order.status as OrderStatus
  const addr = order.delivery_address as { city?: string; address?: string } | null
  const items = Array.isArray(order.items)
    ? (order.items as Array<{ title?: string; quantity?: number; total?: number }>)
    : []

  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-SA'

  function act(newStatus: 'confirmed' | 'shipped' | 'delivered' | 'cancelled', tracking?: string) {
    setError(null)
    startTransition(async () => {
      const res = await brandUpdateOrderStatus(order.id, newStatus, tracking)
      if (res.error) setError(res.error)
    })
  }

  return (
    <>
      <tr
        className={`border-b border-border cursor-pointer hover:bg-surface transition-colors ${
          index % 2 === 0 ? '' : 'bg-surface/30'
        }`}
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-5 py-3.5">
          <p className="text-parchment text-xs font-mono">{order.order_number}</p>
        </td>
        <td className="px-5 py-3.5">
          <p className="text-parchment text-xs">{order.customer_name ?? '—'}</p>
          <p className="text-muted text-[10px]">{order.customer_email ?? ''}</p>
        </td>
        <td className="px-5 py-3.5 text-right">
          <p className="text-parchment text-xs">SAR {Number(order.subtotal).toFixed(2)}</p>
        </td>
        <td className="px-5 py-3.5">
          <span className={`inline-block text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 border ${statusPill(status)}`}>
            {t.status[status as keyof typeof t.status] ?? status}
          </span>
        </td>
        <td className="px-5 py-3.5 text-right">
          <p className="text-muted text-[10px]">
            {new Date(order.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </td>
        <td className="px-5 py-3.5 text-right">
          <span className="text-muted/40 text-[10px]">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-surface/40">
          <td colSpan={6} className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Customer */}
              <div>
                <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-3">{t.detail_customer}</p>
                <div className="space-y-1.5">
                  <p className="text-parchment text-xs">{order.customer_name ?? '—'}</p>
                  {order.customer_phone && <p className="text-muted text-xs">{order.customer_phone}</p>}
                  {order.customer_email && <p className="text-muted text-xs">{order.customer_email}</p>}
                  {addr && (
                    <p className="text-muted text-xs pt-1">
                      {[addr.address, addr.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-3">{t.detail_items}</p>
                <div className="space-y-1.5">
                  {items.length > 0 ? items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-4">
                      <p className="text-parchment text-xs">{item.title ?? '—'} × {item.quantity ?? 1}</p>
                      <p className="text-muted text-xs shrink-0">SAR {Number(item.total ?? 0).toFixed(2)}</p>
                    </div>
                  )) : <p className="text-muted text-xs">—</p>}
                  <div className="border-t border-border pt-2 mt-1 flex justify-between">
                    <p className="text-[10px] text-muted">{t.detail_subtotal}</p>
                    <p className="text-xs text-parchment">SAR {Number(order.subtotal).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Creator attribution */}
              {order.creator_link_id && order.creator_links && (
                <div className="md:col-span-3 border-t border-border pt-4 mt-2">
                  <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-2">{t.detail_attribution}</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[9px] text-muted/50 uppercase tracking-[0.15em] mb-1">{t.detail_link_code}</p>
                      <p className="text-parchment text-xs font-mono">{order.creator_links.link_code}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted/50 uppercase tracking-[0.15em] mb-1">{t.detail_commission}</p>
                      <p className="text-parchment text-xs">{order.creator_links.commission_rate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-3">{t.detail_actions}</p>
                <div className="space-y-2">

                  {order.tracking_number && (
                    <p className="text-muted text-[10px] mb-3">
                      {t.detail_tracking}: <span className="text-parchment font-mono">{order.tracking_number}</span>
                    </p>
                  )}

                  {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

                  {status === 'pending' && (
                    <>
                      <button
                        disabled={isPending}
                        onClick={e => { e.stopPropagation(); act('confirmed') }}
                        className="w-full text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-gold text-ink font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                      >
                        {isPending ? t.btn_updating : t.btn_confirm}
                      </button>
                      <button
                        disabled={isPending}
                        onClick={e => { e.stopPropagation(); act('cancelled') }}
                        className="w-full text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 border border-red-500/30 text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
                      >
                        {t.btn_cancel}
                      </button>
                    </>
                  )}

                  {status === 'confirmed' && (
                    <>
                      <div onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder={t.tracking_placeholder}
                          value={trackingInput}
                          onChange={e => setTrackingInput(e.target.value)}
                          className="w-full bg-surface border border-border text-parchment text-xs px-3 py-2 outline-none focus:border-gold/50 mb-2 font-mono placeholder:text-muted/40"
                        />
                      </div>
                      <button
                        disabled={isPending}
                        onClick={e => { e.stopPropagation(); act('shipped', trackingInput || undefined) }}
                        className="w-full text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-gold text-ink font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                      >
                        {isPending ? t.btn_updating : t.btn_shipped}
                      </button>
                      <button
                        disabled={isPending}
                        onClick={e => { e.stopPropagation(); act('cancelled') }}
                        className="w-full text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 border border-red-500/30 text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
                      >
                        {t.btn_cancel}
                      </button>
                    </>
                  )}

                  {status === 'shipped' && (
                    <button
                      disabled={isPending}
                      onClick={e => { e.stopPropagation(); act('delivered') }}
                      className="w-full text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-green-900/30 border border-green-500/30 text-green-400 hover:bg-green-900/50 transition-colors disabled:opacity-50"
                    >
                      {isPending ? t.btn_updating : t.btn_delivered}
                    </button>
                  )}

                  {!['pending', 'confirmed', 'shipped'].includes(status) && (
                    <p className="text-muted text-xs">{t.detail_no_actions}</p>
                  )}
                </div>
              </div>

            </div>

            {order.brand_notes && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-1.5">{t.detail_notes}</p>
                <p className="text-muted text-xs">{order.brand_notes}</p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function BrandOrdersClient({ orders, locale = 'en' }: { orders: OrderRow[]; locale?: DashLang }) {
  const [tab, setTab] = useState<Tab>('all')
  const t = dt(locale).orders

  const counts: Record<Tab, number> = {
    all:       orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length,
  }

  const filtered = tab === 'all'
    ? orders
    : orders.filter(o => {
        if (tab === 'delivered') return o.status === 'delivered' || o.status === 'completed'
        if (tab === 'cancelled') return o.status === 'cancelled' || o.status === 'refunded'
        return o.status === tab
      })

  const revenue = orders
    .filter(o => o.status === 'delivered' || o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.subtotal), 0)

  return (
    <div className="p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">{t.eyebrow}</p>
        <h1 className="font-display text-3xl font-light text-parchment">{t.heading}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-border border-t-2 border-t-border/60 p-4">
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-2">{t.stat_total}</p>
          <p className="text-2xl text-parchment font-light">{orders.length}</p>
        </div>
        <div className="border border-border p-4" style={{ borderTop: '2px solid rgba(234,179,8,0.4)' }}>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-2">{t.stat_pending}</p>
          <p className="text-2xl font-light" style={{ color: '#facc15' }}>{counts.pending}</p>
        </div>
        <div className="border border-border p-4" style={{ borderTop: '2px solid rgba(168,85,247,0.4)' }}>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-2">{t.stat_shipped}</p>
          <p className="text-2xl font-light" style={{ color: '#c084fc' }}>{counts.shipped}</p>
        </div>
        <div className="border border-border p-4" style={{ borderTop: '2px solid rgba(74,222,128,0.4)' }}>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-2">{t.stat_revenue}</p>
          <p className="text-xl font-light" style={{ color: '#4ade80' }}>SAR {revenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {TABS.map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors ${
              tab === tabKey
                ? 'border-gold text-gold bg-gold/5'
                : 'border-border text-muted hover:text-parchment'
            }`}
          >
            {t.tabs[tabKey]}
            {counts[tabKey] > 0 && (
              <span className="ml-1.5 opacity-50">{counts[tabKey]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <p className="text-muted text-sm">{t.empty_tab(tab)}</p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                {([t.col_order, t.col_customer, t.col_total, t.col_status, t.col_date, ''] as string[]).map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[9px] text-muted tracking-[0.2em] uppercase font-normal ${
                    i === 2 || i === 4 || i === 5 ? 'text-right' : 'text-left'
                  }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <OrderRowItem key={order.id} order={order} index={i} locale={locale} />
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
