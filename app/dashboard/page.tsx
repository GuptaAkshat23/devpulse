'use client'

import { useSession, signOut } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div
          className="mono mb-2 text-xs"
          style={{ color: 'var(--text-3)' }}
        >
          week 1 · auth + middleware ✓
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
          Welcome, {session?.user?.name ?? 'developer'}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
          {session?.user?.email}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mono mt-6 rounded-lg px-4 py-2 text-xs transition-all hover:opacity-80"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
          }}
        >
          sign out →
        </button>
      </div>
    </div>
  )
}