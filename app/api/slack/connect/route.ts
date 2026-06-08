import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/slack/connect
 * Redirects user to Slack OAuth authorization page.
 * After user approves, Slack redirects to /api/slack/callback
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: 'chat:write,chat:write.public,channels:read',
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
  })

  return NextResponse.redirect(
    `https://slack.com/oauth/v2/authorize?${params.toString()}`
  )
}