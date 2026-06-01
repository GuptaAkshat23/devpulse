import { getOctokit } from '@/lib/github'
import { RateLimitError, GitHubAPIError } from '@/lib/github-errors'
import { RequestError } from '@octokit/request-error'

/**
 * The shape of GitHub profile data we care about.
 * We don't expose the raw GitHub API response — we define
 * exactly what our app needs. This protects us if GitHub
 * changes their API response shape.
 */
export type GitHubProfile = {
  login: string        // username e.g. "akshatgupta"
  name: string | null  // display name e.g. "Akshat Gupta"
  avatarUrl: string
  publicRepos: number
  followers: number
  following: number
}

/**
 * Fetches the authenticated user's GitHub profile.
 *
 * Maps the raw GitHub API response to our own GitHubProfile
 * type — we never let external API shapes leak into our app.
 */
export async function getGitHubProfile(
  accessToken: string
): Promise<GitHubProfile> {
  const octokit = getOctokit(accessToken)

  try {
    // This calls GET /user under the hood
    const { data } = await octokit.rest.users.getAuthenticated()

    // Map raw API response → our clean internal type
    return {
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
    }
  } catch (error) {
    // RequestError is Octokit's own error type
    if (error instanceof RequestError) {
      if (error.status === 403) {
        // GitHub puts rate limit reset time in the response headers
        const resetAt = new Date(
          Number(error.response?.headers['x-ratelimit-reset']) * 1000
        )
        throw new RateLimitError(resetAt)
      }
      throw new GitHubAPIError(error.message, error.status)
    }
    throw error
  }
}