'use client'

import { PRActivityChart } from '@/components/dashboard/PRActivityChart'
import { CycleTimeChart } from '@/components/dashboard/CycleTimeChart'
import { ContributorChart } from '@/components/dashboard/ContributorChart'
import { AIReview } from '@/components/dashboard/AIReview'
import { getWeeklyActivity, getCycleTimes } from '@/lib/chart-data'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  GitPullRequest,
  Clock,
  GitMerge,
  Users,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Circle,
} from 'lucide-react'
import Link from 'next/link'
import { PullRequest } from '@/lib/github-prs'
import { RepoMetrics } from '@/lib/pr-metrics'

type PRData = {
  prs: PullRequest[]
  metrics: RepoMetrics
}

function formatHours(hours: number): string {
  if (hours === 0) return '—'
  if (hours < 24) return `${hours}h`
  return `${(hours / 24).toFixed(1)}d`
}

function getPRStateStyle(state: PullRequest['state']) {
  switch (state) {
    case 'MERGED':
      return { color: '#a78bfa', icon: GitMerge }
    case 'OPEN':
      return { color: '#3dd68c', icon: Circle }
    case 'CLOSED':
      return { color: '#f87171', icon: XCircle }
  }
}

export default function RepoAnalyticsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [data, setData] = useState<PRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const repoName = params.repo as string
  const owner = session?.user?.username ?? ''

  useEffect(() => {
    if (!owner) return
    const fetchPRs = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/prs?owner=${owner}&repo=${repoName}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PR data')
      } finally {
        setLoading(false)
      }
    }
    fetchPRs()
  }, [owner, repoName])

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-5xl">

        <Link
          href="/dashboard"
          className="mono mb-6 inline-flex items-center gap-1.5 text-xs transition-all hover:opacity-80"
          style={{ color: 'var(--text-3)' }}
        >
          <ArrowLeft size={12} />
          back to repos
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            {repoName}
          </h1>
          <p className="mono mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
            PR analytics
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: '#2a1a1a', border: '1px solid #ff444433', color: '#ff8080' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Metric Cards */}
            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Total PRs', value: data.metrics.totalPRs, icon: GitPullRequest, color: 'var(--accent)' },
                { label: 'Merge Rate', value: `${data.metrics.mergeRate}%`, icon: GitMerge, color: 'var(--green)' },
                { label: 'Avg Cycle Time', value: formatHours(data.metrics.avgCycleTimeHours), icon: Clock, color: '#f97316' },
                { label: 'Avg First Review', value: formatHours(data.metrics.avgTimeToFirstReviewHours), icon: CheckCircle, color: '#60a5fa' },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="mono text-xs" style={{ color: 'var(--text-3)' }}>
                      {card.label}
                    </span>
                    <card.icon size={14} style={{ color: card.color }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PRActivityChart data={getWeeklyActivity(data.prs)} />
              <CycleTimeChart data={getCycleTimes(data.prs)} />
            </div>

            <div className="mb-8">
              <ContributorChart data={data.metrics.contributorStats} />
            </div>

            {/* Contributor Table */}
            {data.metrics.contributorStats.length > 0 && (
              <div
                className="mb-8 overflow-hidden rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Users size={14} style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                      Contributors
                    </span>
                  </div>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  <div className="mono grid grid-cols-3 px-5 py-2 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span>Username</span>
                    <span className="text-center">PRs Opened</span>
                    <span className="text-center">Reviews Given</span>
                  </div>
                  {data.metrics.contributorStats.map((contributor) => (
                    <div key={contributor.username} className="grid grid-cols-3 px-5 py-3">
                      <span className="mono text-sm" style={{ color: 'var(--text-1)' }}>
                        {contributor.username}
                      </span>
                      <span className="mono text-center text-sm" style={{ color: 'var(--text-2)' }}>
                        {contributor.prsOpened}
                      </span>
                      <span className="mono text-center text-sm" style={{ color: 'var(--text-2)' }}>
                        {contributor.prsReviewed}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PR List */}
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <GitPullRequest size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                    Pull Requests
                  </span>
                  <span className="mono ml-auto text-xs" style={{ color: 'var(--text-3)' }}>
                    {data.prs.length} total
                  </span>
                </div>
              </div>

              {data.prs.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm" style={{ color: 'var(--text-3)' }}>
                  No pull requests found for this repo.
                </div>
              ) : (
                <div>
                  {data.prs.map((pr) => {
                    const stateStyle = getPRStateStyle(pr.state)
                    const StateIcon = stateStyle.icon
                    const cycleTime = pr.mergedAt
                      ? formatHours(
                          Math.round(
                            (new Date(pr.mergedAt).getTime() - new Date(pr.createdAt).getTime()) /
                              (1000 * 60 * 60)
                          )
                        )
                      : null

                    return (
                      <div
                        key={pr.id}
                        className="px-5 py-4"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start gap-3">
                          <StateIcon
                            size={16}
                            style={{ color: stateStyle.color, marginTop: 2, flexShrink: 0 }}
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className="truncate text-sm font-medium"
                              style={{ color: 'var(--text-1)' }}
                            >
                              {pr.title}
                            </div>
                            <div
                              className="mono mt-1 flex items-center gap-3 text-xs"
                              style={{ color: 'var(--text-3)' }}
                            >
                              <span>#{pr.number}</span>
                              <span>{pr.author}</span>
                              {cycleTime && <span>cycle: {cycleTime}</span>}
                              {pr.reviews.length > 0 && (
                                <span>{pr.reviews.length} review{pr.reviews.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <span
                            className="mono shrink-0 rounded px-2 py-0.5 text-xs"
                            style={{
                              background: `${stateStyle.color}22`,
                              color: stateStyle.color,
                            }}
                          >
                            {pr.state.toLowerCase()}
                          </span>
                        </div>
                        <AIReview
                          owner={owner}
                          repo={repoName}
                          prNumber={pr.number}
                          prTitle={pr.title}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}