import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubAccessToken } from '@/lib/get-access-token'
import { getRepoPRs } from '@/lib/github-prs'
import { computeMetrics } from '@/lib/pr-metrics'
import { RateLimitError } from '@/lib/github-errors'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/prs?owner=akshat&repo=devpulse
 *
 * Returns PR list + computed metrics for a single repo.
 * owner and repo come from URL search params.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Read query params from the URL
  const { searchParams } = new URL(req.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing owner or repo query params' },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getGitHubAccessToken(session.user.id)
    const prs = await getRepoPRs(accessToken, owner, repo)
    const metrics = computeMetrics(prs)

    return NextResponse.json({ prs, metrics })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: error.resetAt },
        { status: 429 }
      )
    }
    console.error('PR fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PR data' },
      { status: 500 }
    )
  }
}