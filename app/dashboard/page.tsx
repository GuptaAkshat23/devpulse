'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { GitFork, Star, Lock, Globe, Loader2, RefreshCw } from 'lucide-react'
import { GitHubRepo } from '@/lib/github-repos'
import Link from 'next/link'


export default function DashboardPage() {
  const { data: session } = useSession()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'cache' | 'github' | null>(null)

  const fetchRepos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/repos')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRepos(data.repos)
      setSource(data.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRepos() }, [])

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
              {session?.user?.name ?? 'Dashboard'}
            </h1>
            <p className="mono mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
              {repos.length} repos
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mono rounded-lg px-3 py-2 text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            sign out
          </button>
        </div>
        {loading && <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>}
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
              <Link key={repo.id} href={`/dashboard/${repo.name}`} className="rounded-xl p-4 block" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  {repo.private ? <Lock size={13} style={{ color: 'var(--text-3)' }} /> : <Globe size={13} style={{ color: 'var(--text-3)' }} />}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{repo.name}</span>
                </div>
                {repo.description && <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>{repo.description}</p>}
                <div className="flex gap-4">
                  <span className="mono text-xs" style={{ color: 'var(--text-3)' }}><Star size={11} /> {repo.stars}</span>
                  <span className="mono text-xs" style={{ color: 'var(--text-3)' }}><GitFork size={11} /> {repo.forks}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
