'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminThemeCtx } from './AdminTheme'

const PAGE_NAMES: Record<string, string> = {
  '/dashboard/admin': 'Dashboard',
  '/dashboard/admin/brands': 'Brands',
  '/dashboard/admin/applications': 'Applications',
  '/dashboard/admin/products': 'Products',
  '/dashboard/admin/orders': 'Orders',
}

const NAV = [
  { label: 'Overview',     href: '/dashboard/admin' },
  { label: 'Brands',       href: '/dashboard/admin/brands',       badgeKey: 'brands'      as const },
  { label: 'Applications', href: '/dashboard/admin/applications', badgeKey: 'pendingApps' as const, badgeRed: true },
  { label: 'Products',     href: '/dashboard/admin/products' },
  { label: 'Orders',       href: '/dashboard/admin/orders' },
]

function parseEmail(email: string) {
  const [local] = email.split('@')
  const clean = local.replace(/[0-9_.-]/g, '')
  return {
    initials: clean.slice(0, 2).toUpperCase(),
    name: clean.charAt(0).toUpperCase() + '. ' + (clean.length > 2 ? clean.slice(2) : clean),
  }
}

type Props = {
  children: ReactNode
  userEmail: string
  adminBadges: { brands: number; pendingApps: number }
}

export function AdminDashboardShell({ children, userEmail, adminBadges }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [isDark, setIsDark] = useState(true)

  const { initials, name } = parseEmail(userEmail)
  const pageName = PAGE_NAMES[pathname] ?? 'Dashboard'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <AdminThemeCtx.Provider value={{ isDark }}>
      <div className={`admin-shell${isDark ? '' : ' light'}`}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="a-sidebar">
          <div className="a-sidebar-logo">
            <div className="a-crest"><span>MC</span></div>
            <div className="a-brand">Merchant Club SA</div>
            <div className="a-sub">Platform Admin</div>
          </div>

          <nav className="a-sidebar-nav">
            <div className="a-nav-label">Menu</div>
            {NAV.map(item => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
              const badge = item.badgeKey ? adminBadges[item.badgeKey] : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`a-nav-item${active ? ' a-active' : ''}`}
                >
                  <span className="a-nav-dot" />
                  {item.label}
                  {badge > 0 && (
                    <span className={`a-badge${item.badgeRed ? ' a-badge-red' : ''}`}>
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="a-sidebar-foot">
            <div className="a-user-row">
              <div className="a-avatar">{initials}</div>
              <div>
                <div className="a-uname">{name}</div>
                <div className="a-urole">Super Admin</div>
              </div>
            </div>
            <button className="a-signout" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>

        {/* ── Main ────────────────────────────────────────── */}
        <div className="a-main">

          {/* Topbar */}
          <div className="a-topbar">
            <div className="a-topbar-left">
              <h1 className="a-topbar-title">Merchant Club SA</h1>
              <span className="a-slash">/</span>
              <span className="a-page-name">{pageName}</span>
            </div>

            <div className="a-topbar-right">
              <div className="a-search-bar">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Search brands, orders…
              </div>

              <div className="a-live-pill">
                <div className="a-live-dot" />
                LIVE
              </div>

              <div className="a-icon-btn" aria-label="Notifications">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 2a5 5 0 0 0-5 5v2l-1 2h12l-1-2V7a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
                <div className="a-notif-dot" />
              </div>

              <div className="a-icon-btn" aria-label="Grid">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
              </div>

              <div
                className="a-theme-toggle"
                onClick={() => setIsDark(v => !v)}
                role="button"
                aria-label="Toggle theme"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text2)' }} aria-hidden>
                  <path d="M8 3V1M8 15v-2M3 8H1M15 8h-2M4.9 4.9 3.5 3.5M12.5 12.5l-1.4-1.4M4.9 11.1l-1.4 1.4M12.5 3.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <div className={`a-toggle-track${isDark ? ' a-on' : ''}`}>
                  <div className="a-toggle-thumb" />
                </div>
                <span className="a-theme-label">{isDark ? 'Dark' : 'Light'}</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="a-content">
            {children}
          </div>

        </div>
      </div>
    </AdminThemeCtx.Provider>
  )
}
