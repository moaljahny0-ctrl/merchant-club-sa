'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAdminTheme } from './AdminTheme'

export type TrendDatum = { label: string; revenue: number }
export type DonutDatum = { label: string; value: number }

// Color palettes keyed by mode
const DARK = {
  grid: '#1e1e1c', tick: '#555',
  gold: '#b8975a', green: '#4caf7d', blue: '#5b8df5',
  goldFill: 'rgba(184,151,90,0.08)',
  tooltip: '#111110', ttTitle: '#c9a96e', ttBody: '#888', ttBorder: '#2a2a27',
  donut: ['#b8975a', '#e7dcc3', '#5fa88e', '#7fa9d6', '#c98787'],
}
const LIGHT = {
  grid: '#ede9e2', tick: '#aaa',
  gold: '#8c6a2e', green: '#1e7a4a', blue: '#2a5fc4',
  goldFill: 'rgba(140,106,46,0.06)',
  tooltip: '#fff', ttTitle: '#8c6a2e', ttBody: '#666', ttBorder: '#e0dbd0',
  donut: ['#8c6a2e', '#c9a96e', '#1e7a4a', '#2a5fc4', '#a34f4f'],
}

// ── Sales trend (7-day revenue) ──────────────────────────────────────────────

export function SalesTrendCard({ data }: { data: TrendDatum[] }) {
  const { isDark } = useAdminTheme()
  const C = isDark ? DARK : LIGHT

  return (
    <div className="a-chart-card">
      <div className="a-card-header">
        <div>
          <div className="a-card-title">Sales Overview</div>
          <div className="a-card-sub">Daily revenue, last 7 days</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={155}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.gold} stopOpacity={0.35} />
              <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: C.tick, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: C.tick, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={30}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))}
          />
          <Tooltip
            contentStyle={{
              background: C.tooltip,
              border: `1px solid ${C.ttBorder}`,
              borderRadius: 8,
              color: C.ttBody,
              fontSize: 11,
            }}
            labelStyle={{ color: C.ttTitle, fontWeight: 600, marginBottom: 4 }}
            formatter={(v) => [`SAR ${Math.round(Number(v)).toLocaleString()}`, 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={C.gold}
            strokeWidth={2.5}
            fill="url(#salesGrad)"
            dot={{ fill: C.gold, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Generic donut card (Orders Status, Sales by Brand, etc.) ────────────────

function formatDonutValue(kind: 'count' | 'currency', v: number): string {
  return kind === 'currency' ? `SAR ${Math.round(v).toLocaleString()}` : String(v)
}

function formatDonutTotal(kind: 'count' | 'currency', v: number): string {
  return kind === 'currency' ? `SAR ${Math.round(v).toLocaleString()}` : `${v} Total`
}

export function DonutCard({
  title,
  subtitle,
  data,
  emptyLabel,
  valueKind = 'count',
}: {
  title: string
  subtitle: string
  data: DonutDatum[]
  emptyLabel: string
  valueKind?: 'count' | 'currency'
}) {
  const { isDark } = useAdminTheme()
  const C = isDark ? DARK : LIGHT
  const total = data.reduce((s, d) => s + d.value, 0)
  const formatValue = (v: number) => formatDonutValue(valueKind, v)
  const formatTotal = (v: number) => formatDonutTotal(valueKind, v)

  return (
    <div className="a-chart-card a-donut-section">
      <div className="a-card-header" style={{ width: '100%' }}>
        <div>
          <div className="a-card-title">{title}</div>
          <div className="a-card-sub">{subtitle}</div>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{emptyLabel}</span>
        </div>
      ) : (
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={41}
              outerRadius={55}
              dataKey="value"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={C.donut[i % C.donut.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: C.tooltip,
                border: `1px solid ${C.ttBorder}`,
                borderRadius: 8,
                color: C.ttBody,
                fontSize: 11,
              }}
              formatter={(v, name) => [formatValue(Number(v)), String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div className="a-donut-total">{formatTotal(total)}</div>

      <div style={{ width: '100%' }}>
        {data.map((d, i) => (
          <div key={d.label} className="a-legend-item">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span className="a-ldot" style={{ background: C.donut[i % C.donut.length] }} />
              {d.label}
            </span>
            <span>
              {formatValue(d.value)} — {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
