import { getOctokit } from '@/lib/github'
import { RateLimitError, GitHubAPIError } from '@/lib/github-errors'
import { RequestError } from '@octokit/request-error'

/**
 * Only the repo fields our app actually needs.
 * GitHub returns ~80 fields per repo — we use ~10.
 */
export type GitHubRepo = {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  url: string
  stars: number
  forks: number
  language: string | null
  updatedAt: string | null
  openIssuesCount: number
}

/**
 * Fetches all repos the authenticated user has access to.
 * Handles pagination automatically — GitHub returns max
 * 100 repos per page, this fetches ALL pages.
 */
export async function getUserRepos(
  accessToken: string
): Promise<GitHubRepo[]> {
  const octokit = getOctokit(accessToken)

  try {
    /**
     * octokit.paginate automatically follows the Link header
     * that GitHub sends when there are multiple pages.
     * Without this you'd only get the first 30 repos.
     */
    const repos = await octokit.paginate(
      octokit.rest.repos.listForAuthenticatedUser,
      {
        per_page: 100,      // max allowed per page
        sort: 'updated',    // most recently active first
        affiliation: 'owner,collaborator,organization_member',
      }
    )

    // Map raw response → our clean internal type
    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      updatedAt: repo.updated_at,
      openIssuesCount: repo.open_issues_count,
    }))
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