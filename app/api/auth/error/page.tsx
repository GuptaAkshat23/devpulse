'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mono mb-2 text-xs" style={{ color: 'var(--text-3)' }}>
          auth error
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
          {error ?? 'Something went wrong'}
        </h1>
        <Link
          href="/login"
          className="mono mt-6 inline-block text-xs"
          style={{ color: 'var(--accent)' }}
        >
          ← back to login
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}