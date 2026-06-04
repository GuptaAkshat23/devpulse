import { getOctokit } from '@/lib/github'
import { GitHubAPIError, RateLimitError } from '@/lib/github-errors'
import { RequestError } from '@octokit/request-error'

/**
 * A single file's changes within a PR diff.
 */
export type PRFile = {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
  additions: number
  deletions: number
  patch: string | null
}

/**
 * Fetches the list of files changed in a PR with their diffs.
 * Uses REST API — GitHub GraphQL doesn't expose raw diffs.
 */
export async function getPRDiff(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRFile[]> {
  const octokit = getOctokit(accessToken)

  try {
    const { data } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 30,
    })

    return data.map((file) => ({
      filename: file.filename,
      status: file.status as PRFile['status'],
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch ?? null,
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
 * Converts PR files into a single diff string for the AI.
 * Truncated to ~6000 chars to stay within token limits.
 */
export function formatDiffForAI(files: PRFile[]): string {
  const MAX_CHARS = 6000
  let output = ''

  for (const file of files) {
    if (!file.patch) continue

    const fileSection = `
### ${file.filename} (${file.status})
+${file.additions} -${file.deletions}
\`\`\`diff
${file.patch}
\`\`\`
`
    if (output.length + fileSection.length > MAX_CHARS) {
      output += '\n... (diff truncated for length)'
      break
    }

    output += fileSection
  }

  return output || 'No diff available'
}