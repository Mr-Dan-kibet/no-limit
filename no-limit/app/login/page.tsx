'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { reportError } from '@/lib/errors'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError({ message: 'Enter your email and password' })
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      // Wrong credentials is expected, not a system fault — no correlation ID needed.
      if (authError.status === 400) {
        setError({ message: 'That email and password combination is not right.' })
      } else {
        setError(reportError(authError, '/login'))
      }
      setSubmitting(false)
      return
    }

    // Full reload so middleware re-evaluates with the freshly set session cookie.
    const next = searchParams.get('next') || '/'
    router.replace(next)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading font-bold text-3xl text-coral tracking-wider">NO LIMIT</h1>
          <p className="text-text-muted text-sm mt-1">Personal OS</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5"
            >
              <p className="text-sm text-red-300">{error.message}</p>
              {error.code && (
                <p className="text-xs text-red-300/70 mt-1">
                  Support code: <code className="font-mono">{error.code}</code>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
