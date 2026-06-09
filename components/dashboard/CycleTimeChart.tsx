'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts'
import { PRCycleTime } from '@/lib/chart-data'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-1)',
      }}
    >
      <div className="mono mb-1" style={{ color: 'var(--text-3)' }}>
        {label}
      </div>
      <div style={{ color: '#f97316' }}>
        {payload[0].value}h ({(payload[0].value / 24).toFixed(1)}d)
      </div>
    </div>
  )
}

type Props = {
  data: PRCycleTime[]
}

/**
 * Color-codes bars by cycle time:
 * green = fast (under 24h)
 * orange = medium (1-3 days)
 * red = slow (over 3 days)
 */
function getBarColor(hours: number): string {
  if (hours <= 24) return '#3dd68c'
  if (hours <= 72) return '#f97316'
  return '#f87171'
}

export function CycleTimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-xl text-sm"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-3)',
        }}
      >
        No merged PRs yet — merge a PR to see cycle times
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="mb-4">
        <div className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
          Cycle Time
        </div>
        <div className="mono text-xs" style={{ color: 'var(--text-3)' }}>
          hours from open → merged per PR
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="pr"
            tick={{ fill: 'var(--text-3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'hours',
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--text-3)',
              fontSize: 10,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.hours)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mono mt-2 flex gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
        <span><span style={{ color: '#3dd68c' }}>●</span> under 24h</span>
        <span><span style={{ color: '#f97316' }}>●</span> 1-3 days</span>
        <span><span style={{ color: '#f87171' }}>●</span> over 3 days</span>
      </div>
    </div>
  )
}