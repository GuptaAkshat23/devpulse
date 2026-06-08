import { getOctokit } from '@/lib/github'
import { GitHubAPIError, RateLimitError } from '@/lib/github-errors'
import { RequestError } from '@octokit/request-error'

export type GitHubOrg = {
  id: number
  login: string        // org username e.g. "vercel"
  avatarUrl: string
  description: string | null
}

/**
 * Fetches all GitHub organizations the authenticated user belongs to.
 * Includes both orgs they own and orgs they're a member of.
 */
export async function getUserOrgs(
  accessToken: string
): Promise<GitHubOrg[]> {
  const octokit = getOctokit(accessToken)

  try {
    const { data } = await octokit.rest.orgs.listForAuthenticatedUser({
      per_page: 100,
    })

    return data.map((org) => ({
      id: org.id,
      login: org.login,
      avatarUrl: org.avatar_url,
      description: org.description ?? null,
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

/**
 * Fetches repos for a specific GitHub org.
 * Different endpoint from personal repos.
 */
export async function getOrgRepos(
  accessToken: string,
  org: string
) {
  const octokit = getOctokit(accessToken)

  try {
    const repos = await octokit.paginate(
      octokit.rest.repos.listForOrg,
      {
        org,
        per_page: 100,
        sort: 'updated',
        type: 'all',
      }
    )

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ?? null,
      private: repo.private,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      language: repo.language ?? null,
      updatedAt: repo.updated_at ?? null,
      openIssuesCount: repo.open_issues_count ?? 0,
    }))
  } catch (error) {
    if (error instanceof RequestError) {
      throw new GitHubAPIError(error.message, error.status)
    }
    throw error
  }
}