import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2">

      {/* Left panel — brand image */}
      <div className="hidden md:block relative overflow-hidden">
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-ink to-transparent" />
        <div className="absolute bottom-12 left-12 right-20 z-10">
          <p className="text-[8px] text-gold tracking-[0.4em] uppercase mb-5">
            Merchant Club SA
          </p>
          <p className="font-display text-[2rem] font-light text-parchment leading-[1.15]">
            Every brand here<br />was chosen.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16 bg-ink">

        {/* Logo */}
        <div className="mb-12">
          <Image
            src="/logo.png"
            alt="Merchant Club SA"
            width={40}
            height={40}
            priority
          />
        </div>

        <div className="w-full max-w-[320px]">

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

        </div>

        {/* Footer */}
        <p className="mt-20 text-[9px] text-muted/30 tracking-[0.15em]">
          © {new Date().getFullYear()} Merchant Club SA
        </p>
      </div>

    </div>
  )
}
