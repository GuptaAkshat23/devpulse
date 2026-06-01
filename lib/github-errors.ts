/**
 * Thrown when the GitHub API rate limit is exceeded.
 * The resetAt field tells us when we can try again.
 */
export class RateLimitError extends Error {
  resetAt: Date

  constructor(resetAt: Date) {
    super('GitHub API rate limit exceeded')
    this.name = 'RateLimitError'
    this.resetAt = resetAt
  }
}

/**
 * Thrown when a requested GitHub resource doesn't exist
 * or the token doesn't have permission to see it.
 */
export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`GitHub resource not found: ${resource}`)
    this.name = 'NotFoundError'
  }
}

/**
 * Thrown for any other unexpected GitHub API failure.
 */
export class GitHubAPIError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GitHubAPIError'
    this.status = status
  }
}