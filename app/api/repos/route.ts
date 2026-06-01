import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubAccessToken } from '@/lib/get-access-token'
import { getUserRepos } from '@/lib/github-repos'
import { getCachedRepos, setCachedRepos } from '@/lib/repo-cache'
import { RateLimitError } from '@/lib/github-errors'
import { NextResponse } from 'next/server'

export async function GET() {
  // 1. Get the logged-in user's session
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // 2. Check cache first — avoid hitting GitHub if data is fresh
  const cached = await getCachedRepos(userId)
  if (cached) {
    return NextResponse.json({
      repos: cached,
      source: 'cache',  // useful for debugging
    })
  }

  // 3. Cache miss — fetch from GitHub
  try {
    const accessToken = await getGitHubAccessToken(userId)
    const repos = await getUserRepos(accessToken)

    // 4. Store in cache for next request
    await setCachedRepos(userId, repos)

    return NextResponse.json({
      repos,
      source: 'github',
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: 'GitHub rate limit exceeded',
          retryAt: error.resetAt.toISOString(),
        },
        { status: 429 }
      )
    }

    console.error('Failed to fetch repos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}