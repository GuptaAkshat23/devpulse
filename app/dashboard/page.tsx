'use client'

import { useEffect, useState, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { GitFork, Star, Lock, Globe, Loader2, ChevronDown } from 'lucide-react'
import { GitHubRepo } from '@/lib/github-repos'
import { GitHubOrg } from '@/lib/github-orgs'
import Link from 'next/link'

type Context = {
  type: 'user' | 'org'
  login: string
  avatarUrl?: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [orgs, setOrgs] = useState<GitHubOrg[]>([])
  const [context, setContext] = useState<Context | null>(() => null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOrgMenu, setShowOrgMenu] = useState(false)

  // Set default context once session loads
  const hasSetContext = useRef(false)
  useEffect(() => {
    if (session?.user?.username && !hasSetContext.current) {
      hasSetContext.current = true
      setContext({ type: 'user', login: session.user.username })
    }
  }, [session])

  // Fetch orgs list once
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch('/api/orgs')
        const data = await res.json()
        if (data.orgs) setOrgs(data.orgs)
      } catch {
        // orgs are optional — fail silently
      }
    }
    fetchOrgs()
  }, [])

  // Fetch repos whenever context changes
  useEffect(() => {
    if (!context) return
    const fetchRepos = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = context.type === 'org'
          ? `/api/repos/org?org=${context.login}`
          : '/api/repos'
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setRepos(data.repos)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repos')
      } finally {
        setLoading(false)
      }
    }
    fetchRepos()
  }, [context])

  const switchContext = (newContext: Context) => {
    setContext(newContext)
    setShowOrgMenu(false)
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            {/* Org switcher */}
            <div className="relative">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center gap-2 text-2xl font-bold"
                style={{ color: 'var(--text-1)' }}
              >
                {context?.login ?? session?.user?.name ?? 'Dashboard'}
                {orgs.length > 0 && (
                  <ChevronDown
                    size={18}
                    style={{
                      color: 'var(--text-3)',
                      transform: showOrgMenu ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                )}
              </button>

              {showOrgMenu && (
                <div
                  className="absolute left-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-xl"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Personal account */}
                  <button
                    onClick={() =>
                      switchContext({
                        type: 'user',
                        login: session?.user?.username ?? '',
                      })
                    }
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-all hover:opacity-80"
                    style={{
                      color: context?.type === 'user' ? 'var(--accent)' : 'var(--text-1)',
                      background: context?.type === 'user' ? 'var(--accent-dim)' : 'transparent',
                    }}
                  >
                    <Globe size={13} />
                    {session?.user?.username}
                    <span className="mono ml-auto text-xs" style={{ color: 'var(--text-3)' }}>
                      personal
                    </span>
                  </button>

                  {/* Orgs */}
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() =>
                        switchContext({ type: 'org', login: org.login })
                      }
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-all hover:opacity-80"
                      style={{
                        color: context?.login === org.login ? 'var(--accent)' : 'var(--text-1)',
                        background: context?.login === org.login ? 'var(--accent-dim)' : 'transparent',
                      }}
                    >
                      <Lock size={13} />
                      {org.login}
                      <span className="mono ml-auto text-xs" style={{ color: 'var(--text-3)' }}>
                        org
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="mono mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
              {repos.length} repos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="mono rounded-lg px-3 py-2 text-xs transition-all hover:opacity-80"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}
            >
              settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mono rounded-lg px-3 py-2 text-xs transition-all hover:opacity-80"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}
            >
              sign out
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: '#2a1a1a', border: '1px solid #ff444433', color: '#ff8080' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/dashboard/${repo.name}?owner=${context?.login}`}
                className="block rounded-xl p-4 transition-all hover:border-white/10"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="mb-2 flex items-center gap-2">
                  {repo.private ? (
                    <Lock size={13} style={{ color: 'var(--text-3)' }} />
                  ) : (
                    <Globe size={13} style={{ color: 'var(--text-3)' }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                    {repo.name}
                  </span>
                </div>
                {repo.description && (
                  <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {repo.description}
                  </p>
                )}
                <div className="flex gap-4">
                  <span className="mono flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                    <Star size={11} /> {repo.stars}
                  </span>
                  <span className="mono flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                    <GitFork size={11} /> {repo.forks}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}