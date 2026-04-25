'use client'

import {
  ComposedChart,
  Area,
  Line,
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

export type TrendDatum       = { month: string; applications: number; brands: number }
export type BrandStatusDatum = { label: string; value: number }

// Color palettes keyed by mode
const DARK = {
  grid: '#1e1e1c', tick: '#555',
  gold: '#b8975a', green: '#4caf7d', blue: '#5b8df5',
  goldFill: 'rgba(184,151,90,0.08)',
  tooltip: '#111110', ttTitle: '#c9a96e', ttBody: '#888', ttBorder: '#2a2a27',
  donut: ['#b8975a', '#4caf7d', '#5b8df5'],
}
const LIGHT = {
  grid: '#ede9e2', tick: '#aaa',
  gold: '#8c6a2e', green: '#1e7a4a', blue: '#2a5fc4',
  goldFill: 'rgba(140,106,46,0.06)',
  tooltip: '#fff', ttTitle: '#8c6a2e', ttBody: '#666', ttBorder: '#e0dbd0',
  donut: ['#8c6a2e', '#1e7a4a', '#2a5fc4'],
}

export function AdminCharts({
  trendData,
  brandStatusData,
}: {
  trendData: TrendDatum[]
  brandStatusData: BrandStatusDatum[]
}) {
  const { isDark } = useAdminTheme()
  const C = isDark ? DARK : LIGHT
  const totalBrands = brandStatusData.reduce((s, d) => s + d.value, 0)

  const tooltipStyle = {
    background: C.tooltip,
    border: `1px solid ${C.ttBorder}`,
    borderRadius: 8,
    color: C.ttBody,
    fontSize: 11,
  }

  return (
    <div className="a-charts-row">

      {/* ── Trend line chart ──────────────────────────── */}
      <div className="a-chart-card">
        <div className="a-card-header">
          <div>
            <div className="a-card-title">Applications &amp; Brands Trend</div>
            <div className="a-card-sub">Monthly performance overview</div>
          </div>
          <div className="a-tab-row">
            <button className="a-tab a-tab-active">Monthly</button>
            <button className="a-tab">Weekly</button>
            <button className="a-tab">Daily</button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={155}>
          <ComposedChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.gold} stopOpacity={0.15} />
                <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: C.tick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: C.tick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={24}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: C.ttTitle, fontWeight: 600, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="applications"
              name="Applications"
              stroke={C.gold}
              strokeWidth={2}
              fill="url(#goldGrad)"
              dot={{ fill: C.gold, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="brands"
              name="Active Brands"
              stroke={C.green}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ fill: C.green, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="a-chart-legend">
          <div className="a-chart-legend-item">
            <span className="a-legend-line" style={{ background: C.gold }} />
            Applications
          </div>
          <div className="a-chart-legend-item">
            <span
              className="a-legend-line"
              style={{
                background: 'none',
                borderTop: `2px dashed ${C.green}`,
                display: 'inline-block',
                width: 10,
                height: 0,
                verticalAlign: 'middle',
              }}
            />
            Active Brands
          </div>
        </div>
      </div>

      {/* ── Donut: Brands by Status ───────────────────── */}
      <div className="a-chart-card a-donut-section">
        <div className="a-card-header" style={{ width: '100%' }}>
          <div>
            <div className="a-card-title">Brands by Status</div>
            <div className="a-card-sub">Distribution this quarter</div>
          </div>
        </div>

        {totalBrands === 0 ? (
          <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>No brands yet</span>
          </div>
        ) : (
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={brandStatusData}
                cx="50%"
                cy="50%"
                innerRadius={41}
                outerRadius={55}
                dataKey="value"
                paddingAngle={2}
                strokeWidth={0}
              >
                {brandStatusData.map((_, i) => (
                  <Cell key={i} fill={C.donut[i % C.donut.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [v, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        <div className="a-donut-total">{totalBrands} Total</div>

        <div style={{ width: '100%' }}>
          {brandStatusData.map((d, i) => (
            <div key={d.label} className="a-legend-item">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span className="a-ldot" style={{ background: C.donut[i % C.donut.length] }} />
                {d.label}
              </span>
              <span>
                {d.value} — {totalBrands > 0 ? Math.round((d.value / totalBrands) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
