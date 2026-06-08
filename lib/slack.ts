import { prisma } from '@/lib/prisma'

/**
 * Sends a Block Kit message to the user's connected Slack channel.
 * Returns true if successful, false if no integration or send failed.
 */
export async function sendSlackMessage(
  userId: string,
  blocks: object[],
  text: string // fallback text for notifications
): Promise<boolean> {
  const integration = await prisma.slackIntegration.findUnique({
    where: { userId },
  })

  if (!integration?.botToken) return false

  // Use configured channel or default to general
  const channel = integration.channelId ?? '#general'

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${integration.botToken}`,
    },
    body: JSON.stringify({ channel, blocks, text }),
  })

  const data = await res.json()

  if (!data.ok) {
    console.error('Slack send error:', data.error)
    return false
  }

  return true
}

/**
 * Builds a Block Kit message for a stale PR alert.
 * Stale = open for more than 3 days with no reviews.
 */
export function buildStalePRBlocks(prs: {
  title: string
  number: number
  author: string
  repo: string
  url: string
  daysOpen: number
}[]): object[] {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Stale PRs Need Attention',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${prs.length} PR${prs.length !== 1 ? 's' : ''}* have been open for 3+ days with no reviews.`,
      },
    },
    { type: 'divider' },
    ...prs.map((pr) => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.url}|#${pr.number} ${pr.title}>*\n${pr.repo} · opened by @${pr.author} · *${pr.daysOpen} days* open`,
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Review PR' },
        url: pr.url,
        action_id: `review_pr_${pr.number}`,
      },
    })),
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Sent by <http://localhost:3000|DevPulse> · Configure alerts in your dashboard',
        },
      ],
    },
  ]
}