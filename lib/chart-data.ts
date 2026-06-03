import { PullRequest } from '@/lib/github-prs'

/**
 * Groups PRs by week and counts opened vs merged per week.
 * Used for the PR activity line chart.
 *
 * Why ISO week? It's timezone-independent and consistent.
 * We truncate each date to its Monday to group by week.
 */
export type WeeklyActivity = {
  week: string      // e.g. "May W1"
  opened: number
  merged: number
}

function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.toLocaleString('default', { month: 'short' })
  const weekNum = Math.ceil(date.getDate() / 7)
  return `${month} W${weekNum}`
}

// Returns a zero-padded sortable key: "YYYY-MM-W#"
function getWeekSortKey(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const week = Math.ceil(date.getDate() / 7)
  return `${year}-${month}-W${week}`
}

export function getWeeklyActivity(prs: PullRequest[]): WeeklyActivity[] {
  // Key by sortable ISO string so we can sort correctly later
  const map = new Map<string, WeeklyActivity>()

  prs.forEach((pr) => {
    const sortKey = getWeekSortKey(pr.createdAt)
    const existing = map.get(sortKey) ?? {
      week: getWeekLabel(pr.createdAt),
      opened: 0,
      merged: 0,
    }
    map.set(sortKey, { ...existing, opened: existing.opened + 1 })

    if (pr.mergedAt) {
      const mSortKey = getWeekSortKey(pr.mergedAt)
      const mergedExisting = map.get(mSortKey) ?? {
        week: getWeekLabel(pr.mergedAt),
        opened: 0,
        merged: 0,
      }
      map.set(mSortKey, {
        ...mergedExisting,
        merged: mergedExisting.merged + 1,
      })
    }
  })

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .slice(-12) // last 12 weeks max
}

/**
 * Returns cycle time (hours open → merged) for each merged PR.
 * Used for the cycle time bar chart.
 * Only includes merged PRs — closed/abandoned ones skew the data.
 */
export type PRCycleTime = {
  pr: string      // short label e.g. "#1 fix auth"
  hours: number
  days: number    // hours / 24, for display
}

export function getCycleTimes(prs: PullRequest[]): PRCycleTime[] {
  return prs
    .filter((pr) => pr.state === 'MERGED' && pr.mergedAt)
    .map((pr) => {
      const hours = Math.round(
        (new Date(pr.mergedAt!).getTime() - new Date(pr.createdAt).getTime()) /
          (1000 * 60 * 60)
      )
      return {
        pr: `#${pr.number} ${pr.title.slice(0, 20)}${pr.title.length > 20 ? '...' : ''}`,
        hours,
        days: Math.round((hours / 24) * 10) / 10,
      }
    })
    .slice(-15) // last 15 merged PRs
}