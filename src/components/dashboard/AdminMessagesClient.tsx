'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { adminGetMessagesForBrand, adminSendMessage, type BrandThread } from '@/lib/actions/admin-messages'
import type { Message } from '@/lib/types/database'

function timeAgo(iso: string) {
  return new Date(iso).toLocaleString('en-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminMessagesClient({ threads }: { threads: BrandThread[] }) {
  const [selected, setSelected] = useState<string | null>(threads[0]?.brand_id ?? null)

  return (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>
        Messages
      </h1>

      <div className="a-chart-card" style={{ padding: 0, display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '480px', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', maxHeight: '600px' }}>
          {threads.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No partners yet</div>
          ) : (
            threads.map(t => (
              <button
                key={t.brand_id}
                onClick={() => setSelected(t.brand_id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px',
                  background: selected === t.brand_id ? 'var(--bg3)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{t.brand_name}</span>
                  {t.unread_count > 0 && (
                    <span style={{ fontSize: '11px', background: 'var(--gold)', color: '#1a1208', borderRadius: '10px', padding: '1px 7px' }}>
                      {t.unread_count}
                    </span>
                  )}
                </div>
                {t.last_message && (
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.last_message}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <Thread key={selected} brandId={selected} brandName={threads.find(t => t.brand_id === selected)?.brand_name ?? ''} />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              Select a partner to view messages
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Thread({ brandId, brandName }: { brandId: string; brandName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    adminGetMessagesForBrand(brandId).then(msgs => {
      setMessages(msgs)
      setLoading(false)
    })
  }, [brandId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  function handleSend() {
    if (!draft.trim()) return
    const body = draft.trim()
    setError(null)
    setDraft('')
    startTransition(async () => {
      const result = await adminSendMessage(brandId, body)
      if (result.error) {
        setError(result.error)
      } else {
        setMessages(prev => [...prev, {
          id: `tmp-${Date.now()}`, brand_id: brandId, sender_type: 'admin', sender_id: '',
          body, read_at: null, created_at: new Date().toISOString(),
        }])
      }
    })
  }

  return (
    <>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
        {brandName}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px' }}>
        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No messages yet</div>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{ alignSelf: m.sender_type === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <div style={{
                background: m.sender_type === 'admin' ? 'var(--gold-bg)' : 'var(--bg3)',
                color: m.sender_type === 'admin' ? 'var(--gold)' : 'var(--text)',
                border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '14px',
              }}>
                {m.body}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px', textAlign: m.sender_type === 'admin' ? 'right' : 'left' }}>
                {timeAgo(m.created_at)}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div style={{ padding: '0 16px', fontSize: '12px', color: 'var(--red)' }}>{error}</div>}

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="Type a message…"
          style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
        />
        <button className="a-action-btn a-primary" onClick={handleSend} disabled={isPending || !draft.trim()} style={{ opacity: isPending || !draft.trim() ? 0.5 : 1 }}>
          Send
        </button>
      </div>
    </>
  )
}
