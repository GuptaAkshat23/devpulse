import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/slack/callback?code=...
 * Slack redirects here after user approves.
 * We exchange the code for a bot token and store it.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=no_code', req.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData.error)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=slack_auth', req.url)
      )
    }

    // Store the bot token in DB
    await prisma.slackIntegration.upsert({
      where: { userId: session.user.id },
      update: {
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        botToken: tokenData.access_token,
      },
      create: {
        userId: session.user.id,
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        botToken: tokenData.access_token,
      },
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=slack_connected', req.url)
    )
  } catch (error) {
    console.error('Slack callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=slack_error', req.url)
    )
  }
}