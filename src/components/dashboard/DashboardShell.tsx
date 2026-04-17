'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Brand = {
  id: string
  name_en: string
  status: string
  onboarding_state: string
} | null

type Props = {
  children: ReactNode
  isAdmin: boolean
  brand: Brand
  userEmail: string
}

const brandNav = [
  { label: 'Overview', href: '/dashboard/brand' },
  { label: 'Products', href: '/dashboard/brand/products' },
  { label: 'Orders', href: '/dashboard/brand/orders' },
  { label: 'Profile', href: '/dashboard/brand/profile' },
]

const adminNav = [
  { label: 'Overview', href: '/dashboard/admin' },
  { label: 'Applications', href: '/dashboard/admin/applications' },
  { label: 'Products', href: '/dashboard/admin/products' },
  { label: 'Orders', href: '/dashboard/admin/orders' },
]

export function DashboardShell({ children, isAdmin, brand, userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = isAdmin ? adminNav : brandNav
  const sectionLabel = isAdmin ? 'Admin' : (brand?.name_en ?? 'Brand')

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Brand / section header */}
      <div className="px-6 py-6 border-b border-border">
        <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-1">
          {isAdmin ? 'Platform Admin' : 'Brand Dashboard'}
        </p>
        <p className="text-parchment text-sm font-medium truncate">{sectionLabel}</p>
        {brand && (
          <span className={`inline-block mt-1 text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${
            brand.status === 'active' ? 'bg-green-900/40 text-green-400' :
            brand.status === 'approved' ? 'bg-blue-900/40 text-blue-400' :
            'bg-surface-2 text-muted'
          }`}>
            {brand.status}
          </span>
        )}
      </div>

      {/* Navigation links */}
      <ul className="flex-1 py-4 space-y-0.5 px-3">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard/brand' && item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 text-xs tracking-[0.1em] uppercase transition-colors ${
                  active
                    ? 'text-gold bg-surface-2'
                    : 'text-muted hover:text-parchment hover:bg-surface'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-border space-y-3">
        <p className="text-[10px] text-muted truncate">{userEmail}</p>
        <button
          onClick={handleSignOut}
          className="text-[10px] text-muted hover:text-gold tracking-[0.15em] uppercase transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <p className="text-parchment text-sm font-medium">{sectionLabel}</p>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="text-muted hover:text-gold p-1"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {mobileOpen
              ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink/80" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface border-r border-border">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
