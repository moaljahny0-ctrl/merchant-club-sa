import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-2">Merchant Club SA</p>
          <h1 className="font-display text-3xl font-light text-parchment">Welcome back</h1>
        </div>
        <Suspense fallback={<div className="text-muted text-sm text-center">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
