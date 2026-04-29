'use client'

import { useState, useTransition } from 'react'
import { updateMemberStatus } from '@/lib/actions/admin'

type MemberRow = {
  id: string
  user_id: string | null
  full_name: string | null
  email: string | null
  status: string
  applied_at: string
  reviewed_at: string | null
  notes: string | null
}

const TABS = ['all', 'pending', 'approved', 'rejected'] as const
type Tab = typeof TABS[number]

function pillCls(status: string) {
  if (status === 'approved') return 'a-pill a-p-active'
  if (status === 'pending')  return 'a-pill a-p-pending'
  return 'a-pill'
}

function pillStyle(status: string): React.CSSProperties | undefined {
  if (status === 'rejected') return { background: 'var(--red-bg)', color: 'var(--red)' }
  return undefined
}

export function MembersClient({ members }: { members: MemberRow[] }) {
  const [filter, setFilter] = useState<Tab>('pending')

  const counts: Record<string, number> = { all: members.length }
  for (const m of members) counts[m.status] = (counts[m.status] ?? 0) + 1

  const filtered = filter === 'all' ? members : members.filter(m => m.status === filter)

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Members
      </h1>

      {/* Mini stat boxes */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{members.length}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.pending ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Pending</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--green)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.approved ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Approved</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: '2px solid var(--red)', borderRadius: '8px', padding: '10px 14px', minWidth: '90px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{counts.rejected ?? 0}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginTop: '4px' }}>Rejected</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: '14px' }}>
        <div className="a-tab-row">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`a-tab${filter === tab ? ' a-tab-active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {(counts[tab] ?? 0) > 0 && (
                <span style={{
                  marginLeft: '5px', fontSize: '9px', padding: '1px 5px', borderRadius: '8px',
                  background: filter === tab ? 'rgba(184,151,90,0.3)' : 'var(--border2)',
                  color: filter === tab ? 'var(--gold)' : 'var(--text3)',
                }}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="a-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '11px' }}>
            No members found
          </div>
        ) : (
          <table className="a-stat-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member, i) => (
                <MemberRow key={member.id} member={member} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px' }}>
        {filtered.length} member{filtered.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

function MemberRow({ member, index }: { member: MemberRow; index: number }) {
  const [expanded, setExpanded]     = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function act(status: 'approved' | 'rejected') {
    setActionError(null)
    startTransition(async () => {
      const result = await updateMemberStatus(member.id, status)
      if (result.error) setActionError(result.error)
    })
  }

  const rowBg = index % 2 === 0 ? 'var(--bg)' : 'var(--bg2)'

  return (
    <>
      <tr className="a-trow" style={{ background: rowBg }}>
        <td style={{ color: 'var(--text)', fontWeight: 500 }}>
          {member.full_name ?? '—'}
        </td>
        <td>{member.email ?? '—'}</td>
        <td>
          {new Date(member.applied_at).toLocaleDateString('en-SA', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </td>
        <td>
          <span className={pillCls(member.status)} style={pillStyle(member.status)}>
            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
            {member.status === 'pending' && (
              <>
                <button
                  className="a-action-btn"
                  onClick={() => act('approved')}
                  disabled={isPending}
                  style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--green)', borderColor: 'var(--green)', color: '#fff', opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? '…' : 'Approve'}
                </button>
                <button
                  className="a-action-btn"
                  onClick={() => act('rejected')}
                  disabled={isPending}
                  style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? '…' : 'Reject'}
                </button>
              </>
            )}
            {member.status === 'approved' && (
              <button
                className="a-action-btn"
                onClick={() => act('rejected')}
                disabled={isPending}
                style={{ padding: '4px 10px', fontSize: '10px', background: 'var(--red-bg)', borderColor: 'var(--red)', color: 'var(--red)', opacity: isPending ? 0.5 : 1 }}
              >
                {isPending ? '…' : 'Revoke'}
              </button>
            )}
            <button
              className="a-action-btn"
              onClick={() => setExpanded(v => !v)}
              style={{ padding: '4px 10px', fontSize: '10px' }}
            >
              {expanded ? 'Close' : 'View'}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="a-tr-detail">
          <td colSpan={5} style={{ background: 'var(--bg3)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: member.notes ? '12px' : 0 }}>
              {member.user_id && (
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '3px' }}>User ID</div>
                  <div style={{ fontSize: '10px', color: 'var(--text2)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{member.user_id}</div>
                </div>
              )}
              {member.reviewed_at && (
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '3px' }}>Reviewed</div>
                  <div style={{ fontSize: '11px', color: 'var(--text)' }}>
                    {new Date(member.reviewed_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
            {member.notes && (
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px' }}>Notes</div>
                <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{member.notes}</div>
              </div>
            )}
            {actionError && (
              <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '10px' }}>{actionError}</div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
