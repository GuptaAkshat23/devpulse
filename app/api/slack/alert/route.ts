import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubAccessToken } from '@/lib/get-access-token'
import { getRepoPRs } from '@/lib/github-prs'
import { getUserRepos } from '@/lib/github-repos'
import { sendSlackMessage, buildStalePRBlocks } from '@/lib/slack'
import { NextResponse } from 'next/server'

const STALE_DAYS = 3

/**
 * POST /api/slack/alert
 * Finds stale PRs across all repos and sends a Slack alert.
 * Called manually from settings or by a cron job.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accessToken = await getGitHubAccessToken(session.user.id)
    const repos = await getUserRepos(accessToken)

    const stalePRs: {
      title: string
      number: number
      author: string
      repo: string
      url: string
      daysOpen: number
    }[] = []

    // Check each repo for stale PRs
    for (const repo of repos.slice(0, 10)) { // limit to 10 repos
      try {
        const prs = await getRepoPRs(
          accessToken,
          session.user.username,
          repo.name
        )

        const stale = prs.filter((pr) => {
          if (pr.state !== 'OPEN') return false
          if (pr.reviews.length > 0) return false // has reviews

          const daysOpen =
            (Date.now() - new Date(pr.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)

          return daysOpen >= STALE_DAYS
        })

        stale.forEach((pr) => {
          const daysOpen = Math.floor(
            (Date.now() - new Date(pr.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
          stalePRs.push({
            title: pr.title,
            number: pr.number,
            author: pr.author,
            repo: repo.name,
            url: `https://github.com/${session.user.username}/${repo.name}/pull/${pr.number}`,
            daysOpen,
          })
        })
      } catch {
        // Skip repos we can't access
        continue
      }
    }

    if (stalePRs.length === 0) {
      return NextResponse.json({
        message: 'No stale PRs found',
        sent: false,
      })
    }

    const blocks = buildStalePRBlocks(stalePRs)
    const sent = await sendSlackMessage(
      session.user.id,
      blocks,
      `⚠️ ${stalePRs.length} stale PR(s) need attention`
    )

    return NextResponse.json({
      message: sent ? 'Alert sent' : 'No Slack integration found',
      stalePRs: stalePRs.length,
      sent,
    })
  } catch (error) {
    console.error('Slack alert error:', error)
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 })
  }
}