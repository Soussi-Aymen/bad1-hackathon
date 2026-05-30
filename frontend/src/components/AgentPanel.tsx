import { useCallback, useEffect, useRef, useState } from 'react'
import { askAgent, createTicket } from '../api'
import type { AskResponse, TicketCreateResponse } from '../types'
import { VoiceCall } from './VoiceCall'
import { useVoice } from '../hooks/useVoice'
import { VoiceListeningOverlay } from './VoiceListeningOverlay'

type Tab = 'chat' | 'voice'

type TicketState =
  | { status: 'idle' }
  | { status: 'creating' }
  | { status: 'created'; res: TicketCreateResponse }
  | { status: 'error'; message: string }

type ChatItem =
  | { role: 'user'; text: string }
  | { role: 'agent'; res: AskResponse; ticket: TicketState }

const SUGGESTED = [
  'What is the round size and valuation?',
  'How concentrated is the customer base?',
  'Should I invest in this?',
]

export function AgentPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('chat')
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sendRef = useRef<(message: string) => Promise<void>>(async () => {})

  const voice = useVoice({
    onTranscript: (text) => {
      // When the user finishes speaking, pipe the transcript straight into send().
      void sendRef.current(text)
    },
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [items, loading])

  const lastAgentReply = [...items].reverse().find((it) => it.role === 'agent')?.res.answer ?? ''

  const send = useCallback(
    async (message: string) => {
      const text = message.trim()
      if (!text || loading) return
      setInput('')
      setItems((prev) => [...prev, { role: 'user', text }])
      setLoading(true)
      try {
        const res = await askAgent(text)
        setItems((prev) => [...prev, { role: 'agent', res, ticket: { status: 'idle' } }])
        voice.speak(res.answer)
      } catch {
        setItems((prev) => [
          ...prev,
          {
            role: 'agent',
            res: {
              status: 'missing_answer',
              answer: 'The agent is unavailable right now. Please try again.',
              sources: [],
              ticket_suggestion: null,
              next_actions: [],
            },
            ticket: { status: 'idle' },
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, voice],
  )

  useEffect(() => {
    sendRef.current = send
  }, [send])

  async function raiseTicket(index: number) {
    const item = items[index]
    if (item.role !== 'agent' || !item.res.ticket_suggestion) return
    const suggestion = item.res.ticket_suggestion
    setItems((prev) => updateTicket(prev, index, { status: 'creating' }))
    try {
      const res = await createTicket({
        question: suggestion.question,
        category: suggestion.category,
      })
      setItems((prev) => updateTicket(prev, index, { status: 'created', res }))
    } catch {
      setItems((prev) =>
        updateTicket(prev, index, { status: 'error', message: 'Could not create ticket.' }),
      )
    }
  }

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      {/* drawer */}
      <aside
        className={`fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-edge bg-panel shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-edge px-5 py-3">
          <div>
            <div className="font-semibold text-white">Deal Agent</div>
            <div className="text-xs text-slate-500">RoutePilot AI · approved answers only</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-400 hover:bg-card hover:text-white"
            aria-label="Close agent panel"
          >
            ✕
          </button>
        </header>

        <div className="flex gap-1 border-b border-edge px-3 py-2">
          {(['chat', 'voice'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === t ? 'bg-brand text-white' : 'text-slate-400 hover:bg-card'
              }`}
            >
              {t === 'chat' ? 'Chat' : 'Voice Call'}
            </button>
          ))}
        </div>

        {tab === 'voice' ? (
          <VoiceCall onAskAnother={() => setTab('chat')} />
        ) : (
          <>
        <div className="relative flex min-h-0 flex-1 flex-col">
        {voice.conversationMode && (
          <VoiceListeningOverlay
            bars={voice.bars}
            volume={voice.volume}
            interimTranscript={voice.interimTranscript}
            phase={
              voice.state.status === 'listening'
                ? 'listening'
                : voice.state.status === 'speaking'
                  ? 'speaking'
                  : 'idle'
            }
            lastAgentReply={lastAgentReply}
            onEnd={voice.endConversation}
          />
        )}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {items.length === 0 && !loading && (
            <div className="text-sm text-slate-400">
              <p>Ask anything about RoutePilot. I answer only from the approved diligence packet and never give investment advice.</p>
              <div className="mt-3 space-y-1.5">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="block w-full rounded-lg border border-edge bg-card px-3 py-2 text-left text-xs text-slate-300 hover:border-brand"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((item, i) =>
            item.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm text-white">
                  {item.text}
                </div>
              </div>
            ) : (
              <AgentMessage key={i} item={item} onRaiseTicket={() => raiseTicket(i)} />
            ),
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-soft" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-soft [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-soft [animation-delay:300ms]" />
              Thinking…
            </div>
          )}
        </div>
        </div>

        <div className="border-t border-edge px-4 pt-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {voice.state.status === 'unsupported'
                ? 'Voice not supported in this browser (try Chrome or Edge)'
                : voice.conversationMode
                  ? 'Voice chat active — speak naturally, agent will reply aloud'
                  : voice.state.status === 'error'
                    ? `Voice error: ${voice.state.message}`
                    : 'Type, or tap the mic to start a voice chat'}
            </span>
            {voice.supported && !voice.conversationMode && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={voice.autoSpeak}
                  onChange={(e) => {
                    if (!e.target.checked) voice.stopSpeaking()
                    voice.setAutoSpeak(e.target.checked)
                  }}
                  className="h-3 w-3 accent-brand"
                />
                <span>Speak answers</span>
              </label>
            )}
          </div>
          <form
            className="mt-2 flex gap-2 pb-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            {voice.supported && (
              <button
                type="button"
                onClick={() => {
                  if (voice.conversationMode) voice.endConversation()
                  else voice.startConversation()
                }}
                disabled={loading}
                aria-label={
                  voice.conversationMode ? 'End voice chat' : 'Start voice chat'
                }
                title={voice.conversationMode ? 'End voice chat' : 'Start voice chat'}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition disabled:opacity-40 ${
                  voice.conversationMode
                    ? 'animate-pulse border-red-500/50 bg-red-500/20 text-red-300'
                    : 'border-edge bg-card text-slate-300 hover:border-brand hover:text-white'
                }`}
              >
                {voice.conversationMode ? '⏹' : '🎤'}
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the deal…"
              className="flex-1 rounded-lg border border-edge bg-card px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-soft disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
          </>
        )}
      </aside>
    </>
  )
}

function updateTicket(items: ChatItem[], index: number, ticket: TicketState): ChatItem[] {
  return items.map((it, i) =>
    i === index && it.role === 'agent' ? { ...it, ticket } : it,
  )
}

function AgentMessage({
  item,
  onRaiseTicket,
}: {
  item: Extract<ChatItem, { role: 'agent' }>
  onRaiseTicket: () => void
}) {
  const { res, ticket } = item
  const answered = res.status === 'answered'

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div
          className={`rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed ${
            answered
              ? 'bg-card text-slate-200'
              : 'border border-amber-500/40 bg-amber-500/10 text-amber-100'
          }`}
        >
          {res.answer}
        </div>

        {answered && res.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {res.sources.map((s, i) => (
              <span
                key={`${s.label}-${i}`}
                className="inline-flex items-center gap-1 rounded-md border border-edge bg-panel px-2 py-0.5 text-[11px] text-slate-300"
                title={`Source: ${s.section}`}
              >
                <span className="text-accent">◆</span>
                {s.label}
              </span>
            ))}
          </div>
        )}

        {!answered && res.ticket_suggestion && ticket.status !== 'created' && (
          <div className="rounded-lg border border-edge bg-card p-3">
            <div className="text-xs text-slate-400">Raise this with the VC lead:</div>
            <div className="mt-1 text-sm text-slate-200">
              “{res.ticket_suggestion.question}”
            </div>
            <button
              type="button"
              onClick={onRaiseTicket}
              disabled={ticket.status === 'creating'}
              className="mt-2.5 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {ticket.status === 'creating' ? 'Creating…' : 'Create VC Ticket'}
            </button>
            {ticket.status === 'error' && (
              <div className="mt-2 text-xs text-red-400">{ticket.message}</div>
            )}
          </div>
        )}

        {ticket.status === 'created' && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <div className="font-semibold">✓ Ticket {ticket.res.ticket_id} created</div>
            <div className="mt-0.5 text-xs text-emerald-300/80">
              {ticket.res.message} Estimated response: {ticket.res.estimated_response}.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
