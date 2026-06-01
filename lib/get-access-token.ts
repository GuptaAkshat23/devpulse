import { prisma } from '@/lib/prisma'

/**
 * Retrieves the GitHub access token for a given user
 * from the Account table in the database.
 *
 * Why is this a separate function?
 * Because multiple parts of the app need the token —
 * repo fetching, PR fetching, contributor stats, etc.
 * One function, one place to change if the logic shifts.
 */
export async function getGitHubAccessToken(
  userId: string
): Promise<string> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'github',   // a user could have multiple providers
    },
    select: {
      access_token: true,   // only fetch what we need, not the whole row
    },
  })

  if (!account?.access_token) {
    throw new Error(`No GitHub access token found for user ${userId}`)
  }

  return account.access_token
}