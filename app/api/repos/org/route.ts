import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubAccessToken } from '@/lib/get-access-token'
import { getOrgRepos } from '@/lib/github-orgs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org = req.nextUrl.searchParams.get('org')
  if (!org) {
    return NextResponse.json({ error: 'Missing org param' }, { status: 400 })
  }

  try {
    const accessToken = await getGitHubAccessToken(session.user.id)
    const repos = await getOrgRepos(accessToken, org)
    return NextResponse.json({ repos, source: 'github' })
  } catch (error) {
    console.error('Failed to fetch org repos:', error)
    return NextResponse.json({ error: 'Failed to fetch org repos' }, { status: 500 })
  }
}