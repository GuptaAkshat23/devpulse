import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false })
  }

  const integration = await prisma.slackIntegration.findUnique({
    where: { userId: session.user.id },
    select: { teamName: true, channelName: true },
  })

  return NextResponse.json({
    connected: !!integration,
    teamName: integration?.teamName,
    channelName: integration?.channelName,
  })
}