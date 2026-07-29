'use client'

import { useState, useTransition } from 'react'
import { updatePlatformSettings } from '@/lib/actions/admin-settings'
import { createClient } from '@/lib/supabase/client'
import type { PlatformSettings } from '@/lib/types/database'

const TABS = ['platform', 'account'] as const
type Tab = typeof TABS[number]
const TAB_LABEL: Record<Tab, string> = { platform: 'Platform', account: 'Account' }

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '8px 12px', fontSize: '14px',
  color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const labelStyle: React.CSSProperties = {
  fontSize: '12px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', display: 'block',
}

export function SettingsClient({ settings, userEmail }: { settings: PlatformSettings; userEmail: string }) {
  const [tab, setTab] = useState<Tab>('platform')

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Settings
      </h1>

      <div style={{ marginBottom: '14px' }}>
        <div className="a-tab-row">
          {TABS.map(t => (
            <button key={t} className={`a-tab${tab === t ? ' a-tab-active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === 'platform' ? <PlatformSettingsForm settings={settings} /> : <AccountSection userEmail={userEmail} />}
    </>
  )
}

function PlatformSettingsForm({ settings }: { settings: PlatformSettings }) {
  const [siteName, setSiteName] = useState(settings.site_name)
  const [supportEmail, setSupportEmail] = useState(settings.support_email)
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenance_mode)
  const [commissionRate, setCommissionRate] = useState(String(settings.commission_rate_pct))
  const [lowStockThreshold, setLowStockThreshold] = useState(String(settings.low_stock_default_threshold))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSave() {
    const commission = parseFloat(commissionRate)
    const threshold = parseInt(lowStockThreshold, 10)
    if (Number.isNaN(commission) || Number.isNaN(threshold)) {
      setError('Enter valid numbers.')
      return
    }
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updatePlatformSettings({
        site_name: siteName,
        support_email: supportEmail,
        maintenance_mode: maintenanceMode,
        commission_rate_pct: commission,
        low_stock_default_threshold: threshold,
      })
      if (result.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="a-chart-card" style={{ maxWidth: '520px' }}>
      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '14px', color: 'var(--red)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '14px', color: 'var(--green)' }}>
          Settings saved.
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Site Name</label>
        <input style={fieldStyle} value={siteName} onChange={e => setSiteName(e.target.value)} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Support Email</label>
        <input style={fieldStyle} type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
      </div>

      <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Commission Rate (%)</label>
          <input style={fieldStyle} value={commissionRate} onChange={e => setCommissionRate(e.target.value)} />
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Phase 2 — not yet applied to orders</div>
        </div>
        <div>
          <label style={labelStyle}>Default Low Stock Threshold</label>
          <input style={fieldStyle} value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          id="maintenance-mode"
          type="checkbox"
          checked={maintenanceMode}
          onChange={e => setMaintenanceMode(e.target.checked)}
          style={{ width: '16px', height: '16px' }}
        />
        <label htmlFor="maintenance-mode" style={{ fontSize: '14px', color: 'var(--text)' }}>Maintenance mode</label>
      </div>

      <button
        className="a-action-btn a-primary"
        onClick={handleSave}
        disabled={isPending}
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        {isPending ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}

function AccountSection({ userEmail }: { userEmail: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    setSuccess(false)
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setNewPassword('')
        setConfirm('')
      }
    })
  }

  return (
    <div className="a-chart-card" style={{ maxWidth: '420px' }}>
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Signed in as</label>
        <div style={{ fontSize: '14px', color: 'var(--text)' }}>{userEmail}</div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '14px', color: 'var(--red)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '14px', color: 'var(--green)' }}>
          Password updated.
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>New Password</label>
        <input style={fieldStyle} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Confirm Password</label>
        <input style={fieldStyle} type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </div>

      <button
        className="a-action-btn a-primary"
        onClick={handleSubmit}
        disabled={isPending}
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        {isPending ? 'Updating…' : 'Update Password'}
      </button>
    </div>
  )
}
