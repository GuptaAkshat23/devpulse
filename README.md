# DevPulse

**AI-powered GitHub PR analytics dashboard for engineering teams.**

DevPulse connects to your GitHub account and turns raw pull request activity into actionable insights — cycle time, merge rates, contributor velocity, AI-generated code reviews, and Slack alerts for stale PRs.

🔗 **Live demo:** [devpulse-beta-rouge.vercel.app](https://devpulse-beta-rouge.vercel.app)

---

## What it does

| Feature | Description |
|---|---|
| **PR Analytics** | Cycle time, merge rate, time to first review per repo |
| **Team Velocity** | Weekly contributor breakdown — PRs opened vs reviews given |
| **AI Code Review** | Llama 3.3 70B reads every diff, assigns a risk level, and surfaces actionable review points |
| **Slack Alerts** | Automated Block Kit messages for PRs open 3+ days with no reviews |
| **Org Switching** | Toggle between personal repos and any GitHub organizations you belong to |
| **Recharts Dashboard** | PR activity line chart, cycle time bar chart, contributor activity chart |

---

## Tech stack

**Frontend**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Recharts for data visualization
- Lucide React icons

**Backend / Database**
- Prisma ORM + PostgreSQL (Neon serverless)
- NextAuth.js v4 with GitHub OAuth
- Database-backed sessions

**APIs**
- GitHub REST API via Octokit (repo fetching, PR diffs)
- GitHub GraphQL API (PR analytics, reviews, timelines)
- Groq API — `llama-3.3-70b-versatile` for AI reviews
- Slack Web API + Block Kit for formatted alerts

**Infrastructure**
- Vercel (deployment + serverless functions)
- Sentry (error monitoring + performance)
- GitHub Actions (CI — typecheck + lint on every push)
- Security headers (X-Frame-Options, CSP, Referrer-Policy)

---

## Architecture

```
devpulse/
├── app/
│   ├── (auth)/login/          # GitHub OAuth login page
│   ├── api/
│   │   ├── ai-review/         # POST — Groq diff analysis
│   │   ├── orgs/              # GET — user's GitHub orgs
│   │   ├── prs/               # GET — GraphQL PR fetch + metrics
│   │   ├── repos/             # GET — REST repo list with TTL cache
│   │   ├── repos/org/         # GET — org-scoped repo list
│   │   └── slack/             # OAuth connect, callback, alert, status
│   ├── dashboard/
│   │   ├── page.tsx           # Repo grid with org switcher
│   │   ├── settings/          # Slack integration settings
│   │   └── [repo]/            # Per-repo analytics + AI review
│   └── page.tsx               # Landing page
├── components/dashboard/
│   ├── AIReview.tsx           # AI review button + structured output UI
│   ├── PRActivityChart.tsx    # Recharts line chart
│   ├── CycleTimeChart.tsx     # Recharts bar chart
│   └── ContributorChart.tsx   # Recharts grouped bar chart
├── lib/
│   ├── auth.ts                # NextAuth config + session callbacks
│   ├── github.ts              # Octokit client factory
│   ├── github-prs.ts          # GraphQL PR fetching with pagination
│   ├── github-diff.ts         # PR diff fetching + AI formatting
│   ├── github-orgs.ts         # Org + org repo fetching
│   ├── pr-metrics.ts          # Cycle time, merge rate, contributor stats
│   ├── chart-data.ts          # Data transforms for Recharts
│   ├── slack.ts               # Block Kit builder + message sender
│   ├── repo-cache.ts          # TTL-based DB cache for repos
│   └── rate-limit.ts          # Upstash Redis rate limiter
└── prisma/
    └── schema.prisma          # User, Account, Session, RepoCache, SlackIntegration
```

---

## Data flow

```
GitHub OAuth
     ↓
NextAuth stores access token in PostgreSQL (Account table)
     ↓
Dashboard loads → checks RepoCache (TTL: 5 min)
     ↓ cache miss
Octokit REST → GET /user/repos → store in RepoCache
     ↓
Click repo → GraphQL query for PRs + reviews + timelines
     ↓
pr-metrics.ts computes cycle time, merge rate, contributor stats
     ↓
Recharts renders charts from transformed data
     ↓
Click "Generate AI Review" → fetch PR diff → Groq API
     ↓
Structured JSON response → risk badge + review points
```

---

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) free tier works)
- GitHub OAuth App
- [Groq](https://console.groq.com) API key (free)
- Slack App (optional — for alerts)

### 1. Clone and install

```bash
git clone https://github.com/GuptaAkshat23/devpulse
cd devpulse
npm install
```

### 2. Environment variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://..."

# GitHub OAuth — github.com/settings/developers
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# NextAuth
NEXTAUTH_SECRET=""        # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# AI — console.groq.com (free)
GROQ_API_KEY=""

# Slack — api.slack.com/apps (optional)
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:3000/api/slack/callback"
```

### 3. Database setup

```bash
npx prisma db push
npx prisma generate
```

### 4. GitHub OAuth App setup

Go to [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App:

- **Homepage URL:** `http://localhost:3000`
- **Callback URL:** `http://localhost:3000/api/auth/callback/github`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

---

## Deployment

The app is deployed on Vercel. Every push to `main` triggers:

1. GitHub Actions CI — typecheck + lint
2. Vercel build + deploy (only if CI passes)

To deploy your own instance:

1. Import the repo at [vercel.com](https://vercel.com)
2. Add all environment variables (use your production URLs)
3. Update GitHub OAuth app with the Vercel callback URL:
   ```
   https://your-app.vercel.app/api/auth/callback/github
   ```

---

## Key technical decisions

**Why GraphQL for PRs, REST for repos?**
PR data requires fetching reviews, timelines, and author info in one query — GraphQL does this in a single round trip. Repo listing is a simple paginated list that REST handles cleanly.

**Why database sessions over JWT?**
GitHub access tokens are sensitive. Database sessions can be revoked server-side instantly. JWT sessions persist in the browser until expiry even after a security incident.

**Why TTL cache for repos?**
GitHub's REST API has a 5,000 req/hour rate limit. Caching repo lists for 5 minutes means a user can refresh their dashboard repeatedly without burning through the quota. PRs are fetched fresh on demand since staleness matters more there.

**Why Groq over OpenAI?**
Free tier with generous rate limits, sub-second latency on `llama-3.3-70b-versatile`, and no credit card required — ideal for a portfolio project that needs to stay live.

---

## License

MIT
