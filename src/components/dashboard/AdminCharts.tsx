'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export type MonthlyDatum = { month: string; revenue: number; orders: number }
export type DistributionDatum = { name: string; value: number }

const GOLD = '#D4AF37'
const PIE_COLORS = ['#D4AF37', '#A67C00', '#7A5C00', '#B8860B', '#C8960C', '#9A7209']

const tooltipStyle = {
  background: '#1A1A1A',
  border: '1px solid #252525',
  borderRadius: 0,
  color: '#E8DCC8',
  fontSize: 12,
}

export function AdminCharts({
  monthlyData,
  distributionData,
}: {
  monthlyData: MonthlyDatum[]
  distributionData: DistributionDatum[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-px bg-border mt-px">

      {/* Revenue vs Orders line chart */}
      <div className="bg-surface p-6 md:p-8">
        <p className="text-[9px] text-muted tracking-[0.25em] uppercase mb-1">Revenue vs Orders</p>
        <p className="text-parchment text-sm mb-6">Last 6 months</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#666', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tick={{ fill: '#666', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fill: '#555', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) =>
                name === 'Revenue (SAR)'
                  ? [`SAR ${Number(value).toLocaleString('en-SA', { minimumFractionDigits: 0 })}`, name as string]
                  : [value, name as string]
              }
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke={GOLD}
              strokeWidth={2}
              dot={false}
              name="Revenue (SAR)"
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke="#555555"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px" style={{ background: GOLD }} />
            <p className="text-[10px] text-muted">Revenue</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-px border-t border-dashed border-[#555]" />
            <p className="text-[10px] text-muted">Orders</p>
          </div>
        </div>
      </div>

      {/* Sales distribution donut */}
      <div className="bg-surface p-6 md:p-8">
        <p className="text-[9px] text-muted tracking-[0.25em] uppercase mb-1">Sales Distribution</p>
        <p className="text-parchment text-sm mb-4">By brand</p>
        {distributionData.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-muted text-xs tracking-[0.1em]">No sales data yet</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  dataKey="value"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {distributionData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`SAR ${Number(v).toFixed(0)}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {distributionData.slice(0, 5).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <p className="text-[10px] text-muted truncate flex-1">{d.name}</p>
                  <p className="text-[10px] text-parchment tabular-nums shrink-0">
                    SAR {d.value.toLocaleString('en-SA', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
