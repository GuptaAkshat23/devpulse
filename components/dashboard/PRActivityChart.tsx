'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { WeeklyActivity } from '@/lib/chart-data'

/**
 * Custom tooltip so it matches our dark theme.
 * Recharts default tooltip is white — won't work on our dark bg.
 */
interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
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
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

type Props = {
  data: WeeklyActivity[]
}

export function PRActivityChart({ data }: Props) {
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
        Not enough data to display chart
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
          PR Activity
        </div>
        <div className="mono text-xs" style={{ color: 'var(--text-3)' }}>
          opened vs merged per week
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--text-3)' }}
          />
          <Line
            type="monotone"
            dataKey="opened"
            stroke="#7c6dfa"
            strokeWidth={2}
            dot={{ fill: '#7c6dfa', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="merged"
            stroke="#3dd68c"
            strokeWidth={2}
            dot={{ fill: '#3dd68c', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}