'use client'

import { useState } from 'react'
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react'

type ReviewData = {
  summary: string
  riskLevel: 'low' | 'medium' | 'high'
  riskReason: string
  reviewPoints: string[]
  positives: string[]
}

function getRiskStyle(level: ReviewData['riskLevel']) {
  switch (level) {
    case 'low':
      return { color: '#3dd68c', bg: '#3dd68c22', icon: CheckCircle, label: 'Low Risk' }
    case 'medium':
      return { color: '#f97316', bg: '#f9731622', icon: AlertTriangle, label: 'Medium Risk' }
    case 'high':
      return { color: '#f87171', bg: '#f8717122', icon: XCircle, label: 'High Risk' }
  }
}

type Props = {
  owner: string
  repo: string
  prNumber: number
  prTitle: string
}

export function AIReview({ owner, repo, prNumber, prTitle }: Props) {
  const [review, setReview] = useState<ReviewData | null>(null)
  const [parseError, setParseError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleReview = async () => {
    setReview(null)
    setParseError(false)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, prNumber, prTitle }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      const text = data.result

      try {
        const clean = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim()
        const parsed = JSON.parse(clean) as ReviewData
        setReview(parsed)
        setExpanded(true)
      } catch {
        setParseError(true)
      }
    } catch {
      setParseError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl"
      style={{ border: '1px solid var(--border)' }}
    >
      {!review && !loading && (
        <button
          onClick={handleReview}
          className="mono flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-all hover:opacity-80"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
        >
          <Sparkles size={12} />
          Generate AI Review
        </button>
      )}

      {loading && (
        <div className="px-4 py-3" style={{ background: 'var(--surface-2)' }}>
          <div
            className="mono flex items-center gap-2 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            <Loader2 size={11} className="animate-spin" />
            Analyzing diff with GPT-4o...
          </div>
        </div>
      )}

      {parseError && (
        <div
          className="px-4 py-3 text-xs"
          style={{ color: '#f87171', background: '#2a1a1a' }}
        >
          Failed to parse AI response.{' '}
          <button onClick={handleReview} className="underline">
            Retry
          </button>
        </div>
      )}

      {review && (
        <div style={{ background: 'var(--surface-2)' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={12} style={{ color: 'var(--accent)' }} />
              <span
                className="mono text-xs font-medium"
                style={{ color: 'var(--text-1)' }}
              >
                AI Review
              </span>
              {(() => {
                const style = getRiskStyle(review.riskLevel)
                const Icon = style.icon
                return (
                  <span
                    className="mono flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    style={{ background: style.bg, color: style.color }}
                  >
                    <Icon size={10} />
                    {style.label}
                  </span>
                )
              })()}
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-3)',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {expanded && (
            <div
              className="border-t px-4 pb-4 pt-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <p
                className="mb-4 text-sm leading-relaxed"
                style={{ color: 'var(--text-2)' }}
              >
                {review.summary}
              </p>

              <div
                className="mono mb-4 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: getRiskStyle(review.riskLevel).bg,
                  color: getRiskStyle(review.riskLevel).color,
                }}
              >
                {review.riskReason}
              </div>

              {review.reviewPoints.length > 0 && (
                <div className="mb-4">
                  <div
                    className="mono mb-2 text-xs"
                    style={{ color: 'var(--text-3)' }}
                  >
                    REVIEW POINTS
                  </div>
                  <ul className="flex flex-col gap-2">
                    {review.reviewPoints.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: 'var(--text-2)' }}
                      >
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                          ·
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {review.positives.length > 0 && (
                <div>
                  <div
                    className="mono mb-2 text-xs"
                    style={{ color: 'var(--text-3)' }}
                  >
                    LOOKS GOOD
                  </div>
                  <ul className="flex flex-col gap-2">
                    {review.positives.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: 'var(--text-2)' }}
                      >
                        <span style={{ color: '#3dd68c', flexShrink: 0 }}>
                          ·
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleReview}
                className="mono mt-4 text-xs opacity-50 transition-opacity hover:opacity-100"
                style={{ color: 'var(--text-3)' }}
              >
                ↻ Regenerate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}