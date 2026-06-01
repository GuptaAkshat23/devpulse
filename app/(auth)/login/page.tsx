'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { GitPullRequest, GitBranch, ShieldCheck, Zap, BarChart3, Loader2 } from 'lucide-react'
import { useState } from 'react'

const perks = [
  { icon: ShieldCheck, text: 'Read-only GitHub access. No write permissions ever.' },
  { icon: Zap, text: 'AI summaries generated on your repos in seconds.' },
  { icon: BarChart3, text: 'Team velocity charts ready on first login.' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('github', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(ellipse, #7c6dfa 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--accent)' }}
          >
            <GitPullRequest size={24} color="#fff" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
              Sign in to DevPulse
            </div>
            <div className="mono mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
              GitHub OAuth · secure · read-only
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-6 flex flex-col gap-3">
            {perks.map((p) => (
              <div key={p.text} className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                  style={{ background: 'var(--accent-dim)' }}
                >
                  <p.icon size={13} style={{ color: 'var(--accent)' }} />
                </div>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>

          <div className="my-5" style={{ borderTop: '1px solid var(--border)' }} />

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="mono flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GitBranch size={16} />
            )}
            {loading ? 'Redirecting...' : 'Continue with GitHub'}
          </button>

          <p className="mono mt-4 text-center text-xs" style={{ color: 'var(--text-3)' }}>
            By signing in you agree to our terms.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="mono text-xs transition-colors hover:text-white" style={{ color: 'var(--text-3)' }}>
            ← back to home
          </Link>
        </div>
      </div>
    </div>
  )
}