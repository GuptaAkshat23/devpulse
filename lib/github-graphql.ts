import { getOctokit } from '@/lib/github'
import { RateLimitError, GitHubAPIError } from '@/lib/github-errors'
import { RequestError } from '@octokit/request-error'

/**
 * Executes a GraphQL query against the GitHub API.
 *
 * Why a wrapper function instead of calling octokit.graphql directly?
 * Centralised error handling — rate limit detection happens once here,
 * not scattered across every file that makes GraphQL calls.
 *
 * T is a generic — the caller tells us what shape the response will be.
 * This keeps our responses fully typed throughout the app.
 */
export async function githubGraphQL<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const octokit = getOctokit(accessToken)

  try {
    const response = await octokit.graphql<T>(query, variables)
    return response
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 403) {
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