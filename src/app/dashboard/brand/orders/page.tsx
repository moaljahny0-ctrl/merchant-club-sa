import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/types/database'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  fulfilling: 'Fulfilling',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-yellow-400',
  confirmed: 'text-blue-400',
  fulfilling: 'text-blue-400',
  shipped: 'text-purple-400',
  delivered: 'text-green-400',
  completed: 'text-green-400',
  cancelled: 'text-muted',
  refunded: 'text-red-400',
}

export default async function BrandOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, subtotal, status, created_at, tracking_number')
    .eq('brand_id', member.brand_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Brand Dashboard</p>
        <h1 className="font-display text-3xl font-light text-parchment">Orders</h1>
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="border border-border p-10 text-center">
          <p className="text-muted text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="border border-border">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border">
            {['Order', 'Customer', 'Total', 'Status', 'Date'].map(h => (
              <p key={h} className="text-[9px] text-muted tracking-[0.2em] uppercase">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-border">
            {orders.map(order => (
              <div
                key={order.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-surface transition-colors"
              >
                <div>
                  <p className="text-parchment text-sm font-mono">{order.order_number}</p>
                  {order.tracking_number && (
                    <p className="text-muted text-xs mt-0.5">Track: {order.tracking_number}</p>
                  )}
                </div>
                <div>
                  <p className="text-parchment text-sm">{order.customer_name ?? '—'}</p>
                  <p className="text-muted text-xs">{order.customer_email ?? ''}</p>
                </div>
                <p className="text-parchment text-sm">
                  SAR {Number(order.subtotal).toFixed(2)}
                </p>
                <span className={`text-xs ${STATUS_COLORS[order.status as OrderStatus] ?? 'text-muted'}`}>
                  {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                </span>
                <p className="text-muted text-xs">
                  {new Date(order.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
