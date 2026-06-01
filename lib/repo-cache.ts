import { prisma } from '@/lib/prisma'
import { GitHubRepo } from '@/lib/github-repos'

/**
 * How old cached data can be before we refresh from GitHub.
 * 5 minutes — repos don't change that frequently.
 */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Checks if a valid (non-stale) cache exists for this user.
 * Returns the cached repos if fresh, null if stale or missing.
 */
export async function getCachedRepos(
  userId: string
): Promise<GitHubRepo[] | null> {
  const cache = await prisma.repoCache.findUnique({
    where: { userId },
  })

  if (!cache) return null

  const ageMs = Date.now() - cache.cachedAt.getTime()
  if (ageMs > CACHE_TTL_MS) return null  // stale — refetch

  return cache.data as GitHubRepo[]
}

/**
 * Saves fresh repo data to the cache.
 * Uses upsert — creates a new row if none exists,
 * updates the existing row if it does.
 */
export async function setCachedRepos(
  userId: string,
  repos: GitHubRepo[]
): Promise<void> {
  await prisma.repoCache.upsert({
    where: { userId },
    update: {
      data: repos,
      cachedAt: new Date(),
    },
    create: {
      userId,
      data: repos,
    },
  })
}