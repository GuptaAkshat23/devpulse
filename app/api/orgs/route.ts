import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubAccessToken } from '@/lib/get-access-token'
import { getUserOrgs } from '@/lib/github-orgs'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accessToken = await getGitHubAccessToken(session.user.id)
    const orgs = await getUserOrgs(accessToken)
    return NextResponse.json({ orgs })
  } catch (error) {
    console.error('Failed to fetch orgs:', error)
    return NextResponse.json({ error: 'Failed to fetch orgs' }, { status: 500 })
  }
}