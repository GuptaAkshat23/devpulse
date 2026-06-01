import Link from 'next/link'
import { GitPullRequest, Zap, BarChart3, Bell, ArrowRight, GitBranch } from 'lucide-react'

const features = [
  {
    icon: GitPullRequest,
    label: 'PR Analytics',
    desc: 'Cycle time, merge rate, and reviewer load across every repo.',
  },
  {
    icon: Zap,
    label: 'AI Summaries',
    desc: 'GPT-4o reads every diff and surfaces risk before you do.',
  },
  {
    icon: BarChart3,
    label: 'Team Velocity',
    desc: 'Weekly contributor breakdowns with trend lines.',
  },
  {
    icon: Bell,
    label: 'Slack Alerts',
    desc: 'Stale PR nudges and digest emails, zero config.',
  },
]

const stats = [
  { value: '< 2 min', label: 'avg review triage time' },
  { value: '40 %', label: 'faster merge cycles' },
  { value: '10 ×', label: 'less context switching' },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grid background */}
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

      {/* Glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(ellipse, #7c6dfa 0%, transparent 70%)' }}
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent)' }}
          >
            <GitPullRequest size={16} color="#fff" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
            DevPulse
          </span>
        </div>
        <Link
          href="/login"
          className="mono flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
          }}
        >
          <GitBranch size={14} />
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-4xl px-8 pt-24 text-center">
        <div
          className="mono mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            color: 'var(--accent-hover)',
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--green)' }}
          />
          Week 1 · Auth foundation live
        </div>

        <h1
          className="mb-6 text-6xl font-extrabold leading-[1.08] tracking-tight"
          style={{ color: 'var(--text-1)' }}
        >
          Your GitHub PRs,
          <br />
          <span style={{ color: 'var(--accent)' }}>finally legible.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
          DevPulse connects to your GitHub org and turns PR chaos into clean analytics, AI summaries,
          and proactive Slack alerts.
        </p>

        <Link
          href="/login"
          className="glow inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <GitBranch size={18} />
          Continue with GitHub
          <ArrowRight size={16} />
        </Link>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-2xl"
          style={{ border: '1px solid var(--border)', background: 'var(--border)' }}>
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-6" style={{ background: 'var(--surface)' }}>
              <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                {s.value}
              </div>
              <div className="mono mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="mt-10 grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.label}
              className="rounded-2xl p-5 text-left transition-all hover:border-white/10"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: 'var(--accent-dim)' }}
              >
                <f.icon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="mb-1 font-semibold" style={{ color: 'var(--text-1)' }}>
                {f.label}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="mono relative z-10 py-12 text-center text-xs" style={{ color: 'var(--text-3)' }}>
        DevPulse · built with Next.js 14 + AI
      </footer>
    </div>
  )
}