'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Bell, CheckCircle, XCircle, Loader2, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'

function SettingsContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [slackStatus, setSlackStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading')
  const [alertSending, setAlertSending] = useState(false)
  const [alertResult, setAlertResult] = useState<string | null>(null)

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    const checkSlack = async () => {
      const res = await fetch('/api/slack/status')
      const data = await res.json()
      setSlackStatus(data.connected ? 'connected' : 'disconnected')
    }
    checkSlack()
  }, [success])

  const sendTestAlert = async () => {
    setAlertSending(true)
    setAlertResult(null)
    try {
      const res = await fetch('/api/slack/alert', { method: 'POST' })
      const data = await res.json()
      setAlertResult(data.message)
    } catch {
      setAlertResult('Failed to send alert')
    } finally {
      setAlertSending(false)
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mono mb-6 inline-flex items-center gap-1.5 text-xs transition-all hover:opacity-80"
          style={{ color: 'var(--text-3)' }}
        >
          <ArrowLeft size={12} />
          back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            Settings
          </h1>
          <p className="mono mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
            Manage your integrations and alerts
          </p>
        </div>

        {success === 'slack_connected' && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: '#1a2a1a', border: '1px solid #3dd68c33', color: '#3dd68c' }}
          >
            <CheckCircle size={14} />
            Slack connected successfully!
          </div>
        )}

        {error && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: '#2a1a1a', border: '1px solid #f8717133', color: '#f87171' }}
          >
            <XCircle size={14} />
            {error === 'slack_auth' ? 'Slack authorization failed. Try again.' : 'Something went wrong.'}
          </div>
        )}

        <div
          className="mb-4 rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: '#4A154B' }}
              >
                <MessageSquare size={18} color="#fff" />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                  Slack
                </div>
                <div className="mono text-xs" style={{ color: 'var(--text-3)' }}>
                  Stale PR alerts to your channel
                </div>
              </div>
            </div>
            {slackStatus === 'loading' ? (
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-3)' }} />
            ) : slackStatus === 'connected' ? (
              <span
                className="mono flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                style={{ background: '#1a2a1a', color: '#3dd68c' }}
              >
                <CheckCircle size={11} />
                Connected
              </span>
            ) : (
              <Link
                href="/api/slack/connect"
                className="mono rounded-lg px-4 py-2 text-xs transition-all hover:opacity-90"
                style={{ background: '#4A154B', color: '#fff' }}
              >
                Connect Slack
              </Link>
            )}
          </div>

          {slackStatus === 'connected' && (
            <div
              className="rounded-lg p-3"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Bell size={13} style={{ color: 'var(--accent)' }} />
                <span className="mono text-xs" style={{ color: 'var(--text-2)' }}>
                  Stale PR alerts (PRs open 3+ days with no reviews)
                </span>
              </div>
              <button
                onClick={sendTestAlert}
                disabled={alertSending}
                className="mono flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                }}
              >
                {alertSending ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Bell size={11} />
                )}
                {alertSending ? 'Sending...' : 'Send test alert now'}
              </button>
              {alertResult && (
                <p className="mono mt-2 text-xs" style={{ color: 'var(--text-3)' }}>
                  {alertResult}
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-3 text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            Account
          </div>
          <div className="mono flex flex-col gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
            <div>Name: {session?.user?.name}</div>
            <div>GitHub: @{session?.user?.username}</div>
            <div>Email: {session?.user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
