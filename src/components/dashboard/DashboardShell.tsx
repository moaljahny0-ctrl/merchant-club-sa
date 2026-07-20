'use client'

import type { ReactNode } from 'react'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { setDashboardLocale } from '@/lib/actions/locale'
import { AdminDashboardShell } from './AdminDashboardShell'
import { dt } from '@/lib/dashboard-i18n'

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
  isCreator?: boolean
  userEmail: string
  adminBadges?: { brands: number; pendingApps: number }
  locale?: 'en' | 'ar'
}

const brandNavHrefs = [
  { key: 'overview'   as const, href: '/dashboard/brand' },
  { key: 'products'   as const, href: '/dashboard/brand/products' },
  { key: 'orders'     as const, href: '/dashboard/brand/orders' },
  { key: 'storefront' as const, href: '/dashboard/brand/storefront' },
  { key: 'analytics'  as const, href: '/dashboard/brand/analytics' },
  { key: 'profile'    as const, href: '/dashboard/brand/profile' },
]

const creatorNavHrefs = [
  { key: 'overview' as const, href: '/dashboard/creator' },
]

const adminNav = [
  { label: 'Overview',      href: '/dashboard/admin' },
  { label: 'Brands',        href: '/dashboard/admin/brands' },
  { label: 'Applications',  href: '/dashboard/admin/applications' },
  { label: 'Products',      href: '/dashboard/admin/products' },
  { label: 'Orders',        href: '/dashboard/admin/orders' },
]

export function DashboardShell({ children, isAdmin, brand, isCreator = false, userEmail, adminBadges, locale = 'en' }: Props) {
  const t = dt(locale)
  // Hooks must be called unconditionally (Rules of Hooks)
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [localePending, startLocaleTransition] = useTransition()

  function toggleLocale() {
    const next = locale === 'en' ? 'ar' : 'en'
    startLocaleTransition(async () => {
      await setDashboardLocale(next)
    })
  }

  if (isAdmin) {
    return (
      <AdminDashboardShell
        userEmail={userEmail}
        adminBadges={adminBadges ?? { brands: 0, pendingApps: 0 }}
      >
        {children}
      </AdminDashboardShell>
    )
  }

  const brandNav = brandNavHrefs.map(item => ({ label: t.nav[item.key], href: item.href }))
  const creatorNav = creatorNavHrefs.map(item => ({ label: t.nav[item.key], href: item.href }))
  const showCreatorNav = !brand && isCreator
  const nav = isAdmin ? adminNav : showCreatorNav ? creatorNav : brandNav
  const sectionLabel = isAdmin
    ? t.shell.platform_admin
    : showCreatorNav
    ? t.shell.creator_portal
    : (brand?.name_en ?? 'Brand')
  const portalLabel = isAdmin ? t.shell.platform_admin : showCreatorNav ? t.shell.creator_portal : t.shell.partner_portal

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Logo + wordmark */}
      <div className="px-6 py-6 border-b border-border flex items-center gap-3.5">
        <Image src="/logo.png" alt="Merchant Club SA" width={30} height={30} className="shrink-0" />
        <div>
          <p className="text-[9px] text-gold tracking-[0.3em] uppercase leading-none mb-1">
            Merchant Club SA
          </p>
          <p className="text-[8px] text-muted/70 tracking-[0.2em] uppercase leading-none">
            {portalLabel}
          </p>
        </div>
      </div>

      {/* Brand identity strip */}
      {(brand || isAdmin) && (
        <div className="px-6 py-5 border-b border-border">
          <p className="text-[8px] text-muted/60 tracking-[0.2em] uppercase mb-1.5">
            {isAdmin ? t.shell.access_level : t.shell.active_brand}
          </p>
          <p className="text-parchment text-[13px] font-medium leading-snug truncate">
            {sectionLabel}
          </p>
          {brand && (
            <span className={`inline-block mt-2 text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 border ${
              brand.status === 'active'
                ? 'border-green-700/40 text-green-400/80 bg-green-900/10'
                : brand.status === 'approved'
                ? 'border-blue-700/40 text-blue-400/80 bg-blue-900/10'
                : 'border-border text-muted/60'
            }`}>
              {brand.status}
            </span>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 py-4 px-3">
        <p className="text-[8px] text-muted/40 tracking-[0.2em] uppercase px-3 mb-2">{t.shell.menu}</p>
        <ul className="space-y-0.5">
          {nav.map(item => {
            const active = pathname === item.href || (
              item.href !== '/dashboard/brand' &&
              item.href !== '/dashboard/admin' &&
              pathname.startsWith(item.href)
            )
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-all duration-150 ${locale === 'ar' ? 'border-r-2 rounded-l-sm' : 'border-l-2 rounded-r-sm'} ${
                    active
                      ? 'border-gold text-gold bg-gold/5 font-medium'
                      : 'border-transparent text-muted/80 hover:text-parchment hover:bg-surface-2/60 hover:border-border'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-6 pt-4 pb-6 border-t border-border">
        <p className="text-[9px] text-muted/40 truncate mb-3 leading-none tracking-wide">{userEmail}</p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={toggleLocale}
            disabled={localePending}
            className="text-[9px] text-muted/60 hover:text-gold tracking-[0.15em] uppercase transition-colors disabled:opacity-40"
            title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            {locale === 'en' ? t.shell.switch_to_ar : t.shell.switch_to_en}
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="text-[9px] text-muted/60 hover:text-gold tracking-[0.15em] uppercase transition-colors"
        >
          {t.shell.sign_out}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Merchant Club SA" width={22} height={22} />
          <p className="text-parchment text-sm font-medium tracking-wide">{sectionLabel}</p>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="text-muted hover:text-gold p-1 transition-colors"
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
          <aside
            className="absolute top-0 bottom-0 w-64 bg-surface"
            style={{ [locale === 'ar' ? 'right' : 'left']: 0, borderRight: locale === 'ar' ? 'none' : '1px solid var(--border)', borderLeft: locale === 'ar' ? '1px solid var(--border)' : 'none' }}
          >
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
