import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-8 py-16">

      <div className="w-full max-w-[340px]">

        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <Image
            src="/logo.png"
            alt="Merchant Club SA"
            width={40}
            height={40}
            priority
          />
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[8px] text-gold tracking-[0.4em] uppercase mb-4">
            Brand & Partner Portal
          </p>
          <h1 className="font-display text-[2.25rem] font-light text-parchment leading-none">
            Sign in
          </h1>
        </div>

        {/* Rule */}
        <div className="h-px bg-border mb-10" />

        <Suspense fallback={<div className="text-muted text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>

        {/* Customer note */}
        <div className="mt-10 border border-border/40 bg-surface/30 px-4 py-4">
          <p className="text-[9px] text-muted/60 leading-relaxed text-center">
            Looking to track your order?{' '}
            <a href="/track-order" className="text-gold hover:underline">
              Track it here
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[9px] text-muted/30 tracking-[0.15em] text-center">
          © {new Date().getFullYear()} Merchant Club SA
        </p>

      </div>

    </div>
  )
}
