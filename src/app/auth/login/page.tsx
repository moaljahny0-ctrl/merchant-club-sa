import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#F5F0E8' }}>
      <div className="w-full max-w-[400px]">
        <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(26,18,8,0.05)' }} className="p-8 md:p-10">

          <div className="mb-8 flex justify-center">
            <Image src="/logo.png" alt="Merchant Club SA" width={40} height={40} priority />
          </div>

          <p style={{ color: '#B8975A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>
            Brand & Partner Portal
          </p>
          <h1 style={{ color: '#1A1208', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '32px', lineHeight: 1.2, textAlign: 'center' }}>
            Sign in
          </h1>

          <Suspense fallback={<div style={{ color: '#6B5B4E', fontSize: '15px' }}>Loading…</div>}>
            <LoginForm />
          </Suspense>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E5DDD0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '14px', color: '#6B5B4E', textAlign: 'center' }}>
              Are you a customer?{' '}
              <Link href="/store/login" style={{ color: '#B8975A', textDecoration: 'none' }}>Login here →</Link>
            </p>
            <p style={{ fontSize: '14px', color: '#6B5B4E', textAlign: 'center' }}>
              Looking to track your order?{' '}
              <Link href="/track-order" style={{ color: '#B8975A', textDecoration: 'none' }}>Track it here</Link>
            </p>
          </div>

        </div>
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#6B5B4E', textAlign: 'center', letterSpacing: '0.05em' }}>
          © {new Date().getFullYear()} Merchant Club SA
        </p>
      </div>
    </div>
  )
}
