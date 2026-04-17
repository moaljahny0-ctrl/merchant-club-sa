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
            Partner portal
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

        {/* Footer */}
        <p className="mt-16 text-[9px] text-muted/30 tracking-[0.15em] text-center">
          © {new Date().getFullYear()} Merchant Club SA
        </p>

      </div>

    </div>
  )
}
