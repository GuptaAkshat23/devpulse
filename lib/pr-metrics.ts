import { PullRequest } from '@/lib/github-prs'

/**
 * All computed metrics for a single repo.
 * These are what get displayed on the dashboard charts.
 */
export type RepoMetrics = {
  totalPRs: number
  mergedPRs: number
  openPRs: number
  closedPRs: number
  mergeRate: number              // percentage 0-100
  avgCycleTimeHours: number      // open → merged
  avgTimeToFirstReviewHours: number
  contributorStats: ContributorStat[]
}

export type ContributorStat = {
  username: string
  prsOpened: number
  prsReviewed: number
}

/**
 * Converts two date strings into the difference in hours.
 * Used for cycle time and review time calculations.
 */
function hoursBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return ms / (1000 * 60 * 60)
}

/**
 * Computes all metrics from a list of PRs.
 *
 * Why a pure function with no side effects?
 * Easy to test — pass in PRs, get metrics back.
 * No database, no API, no state to worry about.
 */
export function computeMetrics(prs: PullRequest[]): RepoMetrics {
  const merged = prs.filter((pr) => pr.state === 'MERGED')
  const open = prs.filter((pr) => pr.state === 'OPEN')
  const closed = prs.filter((pr) => pr.state === 'CLOSED')

  // Merge rate — what % of non-open PRs got merged
  const decidedPRs = merged.length + closed.length
  const mergeRate = decidedPRs === 0
    ? 0
    : Math.round((merged.length / decidedPRs) * 100)

  // Avg cycle time — only for merged PRs (closed ones were abandoned)
  const cycleTimes = merged
    .filter((pr) => pr.mergedAt !== null)
    .map((pr) => hoursBetween(pr.createdAt, pr.mergedAt!))

  const avgCycleTimeHours = cycleTimes.length === 0
    ? 0
    : Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)

  // Avg time to first review — only PRs that have at least one review
  const reviewTimes = prs
    .filter((pr) => pr.reviews.length > 0)
    .map((pr) => {
      const firstReview = pr.reviews[0] // already ordered by date from API
      return hoursBetween(pr.createdAt, firstReview.submittedAt)
    })

  const avgTimeToFirstReviewHours = reviewTimes.length === 0
    ? 0
    : Math.round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length)

  // Contributor stats — aggregate per username
  const contributorMap = new Map<string, ContributorStat>()

  // Count PRs opened per person
  prs.forEach((pr) => {
    const existing = contributorMap.get(pr.author) ?? {
      username: pr.author,
      prsOpened: 0,
      prsReviewed: 0,
    }
    contributorMap.set(pr.author, {
      ...existing,
      prsOpened: existing.prsOpened + 1,
    })
  })

  // Count reviews given per person
  prs.forEach((pr) => {
    pr.reviews.forEach((review) => {
      const existing = contributorMap.get(review.author) ?? {
        username: review.author,
        prsOpened: 0,
        prsReviewed: 0,
      }
      contributorMap.set(review.author, {
        ...existing,
        prsReviewed: existing.prsReviewed + 1,
      })
    })
  })

  const contributorStats = Array.from(contributorMap.values())
    .sort((a, b) => b.prsOpened - a.prsOpened) // most active first

  return {
    totalPRs: prs.length,
    mergedPRs: merged.length,
    openPRs: open.length,
    closedPRs: closed.length,
    mergeRate,
    avgCycleTimeHours,
    avgTimeToFirstReviewHours,
    contributorStats,
  }
}