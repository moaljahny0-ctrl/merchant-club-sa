import { Suspense } from 'react'
import { ConfirmResetForm } from './ConfirmResetForm'

export default function ConfirmResetPasswordPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-10 text-center">
          <p className="text-[13px] text-gold tracking-[0.35em] uppercase mb-2">Merchant Club SA</p>
          <h1 className="font-display text-3xl font-light text-parchment">Set your password</h1>
        </div>

        <Suspense fallback={<p className="text-muted text-base text-center">Loading…</p>}>
          <ConfirmResetForm />
        </Suspense>

      </div>
    </div>
  )
}
