import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/types/database'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', userId)

  const isAdmin = (data ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'platform_admin')
    }
  )
  if (!isAdmin) redirect('/dashboard/brand')
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

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, brands(name_en)')
    .order('created_at', { ascending: false })
    .limit(200)

  const totalRevenue = (orders ?? [])
    .filter(o => ['completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.subtotal), 0)

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Admin</p>
        <h1 className="font-display text-3xl font-light text-parchment">Orders</h1>
        <p className="text-muted text-sm mt-1">
          {orders?.length ?? 0} orders · SAR {totalRevenue.toLocaleString('en-SA', { minimumFractionDigits: 2 })} revenue
        </p>
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="border border-border p-10 text-center">
          <p className="text-muted text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="border border-border">
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border">
            {['Order #', 'Brand', 'Customer', 'Total', 'Status', 'Date'].map(h => (
              <p key={h} className="text-[9px] text-muted tracking-[0.2em] uppercase">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-border">
            {(orders ?? []).map(order => {
              const brandName = order.brands?.name_en ?? '—'
              return (
                <div
                  key={order.id}
                  className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-surface transition-colors"
                >
                  <p className="text-parchment text-xs font-mono">{order.order_number}</p>
                  <p className="text-parchment text-sm truncate">{brandName}</p>
                  <div>
                    <p className="text-parchment text-sm">{order.customer_name ?? '—'}</p>
                    <p className="text-muted text-xs">{order.customer_email ?? ''}</p>
                  </div>
                  <p className="text-parchment text-sm">SAR {Number(order.subtotal).toFixed(2)}</p>
                  <span className={`text-xs ${STATUS_COLORS[order.status as OrderStatus] ?? 'text-muted'}`}>
                    {order.status}
                  </span>
                  <p className="text-muted text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
