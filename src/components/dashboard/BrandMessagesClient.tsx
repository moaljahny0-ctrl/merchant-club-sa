'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { sendBrandMessage } from '@/lib/actions/brand-messages'
import type { Message } from '@/lib/types/database'
import type { DashLang } from '@/lib/dashboard-i18n'

function timeAgo(iso: string, locale: DashLang) {
  return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function BrandMessagesClient({ initialMessages, locale }: { initialMessages: Message[]; locale: DashLang }) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  function handleSend() {
    if (!draft.trim()) return
    const body = draft.trim()
    setError(null)
    setDraft('')
    startTransition(async () => {
      const result = await sendBrandMessage(body)
      if (result.error) {
        setError(result.error)
      } else {
        setMessages(prev => [...prev, {
          id: `tmp-${Date.now()}`, brand_id: '', sender_type: 'brand', sender_id: '',
          body, read_at: null, created_at: new Date().toISOString(),
        }])
      }
    })
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-4">{locale === 'ar' ? 'الرسائل' : 'Messages'}</h1>

      <div className="border border-border bg-surface rounded-lg flex flex-col" style={{ height: '560px' }}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="text-muted text-sm">{locale === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</div>
          ) : (
            messages.map(m => (
              <div key={m.id} className={`max-w-[75%] ${m.sender_type === 'brand' ? 'self-end' : 'self-start'}`}>
                <div className={`rounded-lg px-3 py-2 text-sm border ${m.sender_type === 'brand' ? 'bg-gold/10 text-gold border-gold/30' : 'bg-ink text-white border-border'}`}>
                  {m.body}
                </div>
                <div className={`text-xs text-muted mt-1 ${m.sender_type === 'brand' ? 'text-right' : 'text-left'}`}>
                  {timeAgo(m.created_at, locale)}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="px-4 text-xs text-red-400">{error}</div>}

        <div className="border-t border-border p-3 flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            placeholder={locale === 'ar' ? 'اكتب رسالة…' : 'Type a message…'}
            className="flex-1 bg-ink border border-border rounded-md px-3 py-2 text-sm text-white outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !draft.trim()}
            className="px-4 py-2 rounded-md bg-gold text-ink text-sm font-medium disabled:opacity-50"
          >
            {locale === 'ar' ? 'إرسال' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
