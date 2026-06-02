import { githubGraphQL } from '@/lib/github-graphql'

/**
 * A single review on a PR.
 * We track who reviewed and when — needed for
 * "time to first review" metric.
 */
export type PRReview = {
  author: string
  submittedAt: string
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'
}

/**
 * A pull request with all data needed for analytics.
 * Every metric we compute comes from these fields.
 */
export type PullRequest = {
  id: string
  number: number
  title: string
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  author: string
  createdAt: string       // when PR was opened
  mergedAt: string | null // null if not merged
  closedAt: string | null // null if still open
  additions: number       // lines added
  deletions: number       // lines removed
  reviews: PRReview[]
}

/**
 * Raw shape of GitHub's GraphQL response.
 * We define this separately from PullRequest because
 * the API response has nested structures we flatten.
 */
type GraphQLResponse = {
  repository: {
    pullRequests: {
      nodes: Array<{
        id: string
        number: number
        title: string
        state: string
        author: { login: string } | null
        createdAt: string
        mergedAt: string | null
        closedAt: string | null
        additions: number
        deletions: number
        reviews: {
          nodes: Array<{
            author: { login: string } | null
            submittedAt: string
            state: string
          }>
        }
      }>
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
    }
  }
}

/**
 * The GraphQL query for fetching PRs.
 * Defined as a constant so it's easy to read, test, and modify.
 *
 * Why 'first: 50'? GitHub caps GraphQL at 100 nodes per request.
 * 50 is a safe default that leaves room for nested nodes (reviews).
 */
const PR_QUERY = `
  query GetPullRequests($owner: String!, $repo: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      pullRequests(
        first: $first
        after: $after
        states: [OPEN, MERGED, CLOSED]
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          number
          title
          state
          author { login }
          createdAt
          mergedAt
          closedAt
          additions
          deletions
          reviews(first: 10) {
            nodes {
              author { login }
              submittedAt
              state
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

/**
 * Fetches all PRs for a given repo using GraphQL.
 * Handles pagination — keeps fetching until no more pages.
 *
 * owner: the GitHub username or org name e.g. "akshat"
 * repo:  the repo name e.g. "devpulse"
 */
export async function getRepoPRs(
  accessToken: string,
  owner: string,
  repo: string
): Promise<PullRequest[]> {
  const allPRs: PullRequest[] = []
  let hasNextPage = true
  let cursor: string | null = null

  // Keep fetching pages until GitHub says there are no more
  while (hasNextPage) {
    const response: GraphQLResponse = await githubGraphQL<GraphQLResponse>(
  accessToken,
  PR_QUERY,
  { owner, repo, first: 50, after: cursor }
)

const { nodes, pageInfo }: {
  nodes: GraphQLResponse['repository']['pullRequests']['nodes']
  pageInfo: GraphQLResponse['repository']['pullRequests']['pageInfo']
} = response.repository.pullRequests

    // Map raw GraphQL response → our clean PullRequest type
    const mapped: PullRequest[] = nodes.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state as PullRequest['state'],
      author: pr.author?.login ?? 'ghost', // deleted GitHub accounts show as null
      createdAt: pr.createdAt,
      mergedAt: pr.mergedAt,
      closedAt: pr.closedAt,
      additions: pr.additions,
      deletions: pr.deletions,
      reviews: pr.reviews.nodes.map((r) => ({
        author: r.author?.login ?? 'ghost',
        submittedAt: r.submittedAt,
        state: r.state as PRReview['state'],
      })),
    }))

    allPRs.push(...mapped)
    hasNextPage = pageInfo.hasNextPage
    cursor = pageInfo.endCursor
  }

  return allPRs
}