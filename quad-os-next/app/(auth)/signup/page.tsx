'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo + wordmark */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-lg shadow-black/10">
          <span className="text-white font-black text-2xl leading-none">Q</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight">Quad</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Everything campus, one place.</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-xl shadow-black/[0.06]">
        <h2 className="text-lg font-bold mb-5">Create your account</h2>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="full_name" className="text-sm font-medium">Full name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              placeholder="Aiko Tanaka"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@university.edu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground">At least 6 characters</p>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 px-4 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-85 disabled:opacity-50 transition-opacity mt-1"
          >
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-foreground hover:opacity-70 transition-opacity underline underline-offset-2"
        >
          Sign in →
        </Link>
      </p>
    </div>
  )
}
