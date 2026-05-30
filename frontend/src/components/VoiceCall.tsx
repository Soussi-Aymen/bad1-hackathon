import { useState } from 'react'
import { requestIntro, startVoiceCall } from '../api'
import type { IntroRequestResponse, VoiceCallResponse } from '../types'

const TOPIC = 'operational risk and pilot evidence'

// Maps backend next_action tags to button labels.
const ACTION_LABELS: Record<string, string> = {
  request_intro: 'Request Intro',
  ask_follow_up: 'Ask another question',
  wait_for_ticket: 'Wait for ticket',
}

type CallState =
  | { status: 'idle' }
  | { status: 'calling' }
  | { status: 'done'; res: VoiceCallResponse }
  | { status: 'error' }

type IntroState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; res: IntroRequestResponse }
  | { status: 'error' }

export function VoiceCall({ onAskAnother }: { onAskAnother: () => void }) {
  const [call, setCall] = useState<CallState>({ status: 'idle' })
  const [intro, setIntro] = useState<IntroState>({ status: 'idle' })
  const [waiting, setWaiting] = useState(false)

  async function start() {
    setCall({ status: 'calling' })
    setIntro({ status: 'idle' })
    setWaiting(false)
    try {
      const res = await startVoiceCall(TOPIC)
      setCall({ status: 'done', res })
    } catch {
      setCall({ status: 'error' })
    }
  }

  async function handleAction(action: string) {
    if (action === 'ask_follow_up') {
      onAskAnother()
    } else if (action === 'wait_for_ticket') {
      setWaiting(true)
    } else if (action === 'request_intro') {
      setIntro({ status: 'sending' })
      try {
        const res = await requestIntro()
        setIntro({ status: 'sent', res })
      } catch {
        setIntro({ status: 'error' })
      }
    }
  }

  return (
    <div className="flex h-full flex-col px-5 py-4">
      {call.status === 'idle' && (
        <div className="m-auto max-w-xs text-center">
          <div className="text-4xl">📞</div>
          <h3 className="mt-3 font-semibold text-white">Voice AI Call</h3>
          <p className="mt-1 text-sm text-slate-400">
            The Voice AI Agent calls the deal on your behalf to probe{' '}
            <span className="text-slate-300">{TOPIC}</span>, then reports back a summary and
            any unresolved items.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-soft"
          >
            Start Voice AI Call
          </button>
        </div>
      )}

      {call.status === 'calling' && (
        <div className="m-auto text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/20">
            <span className="h-10 w-10 animate-ping rounded-full bg-brand/60" />
          </div>
          <p className="mt-4 text-sm text-slate-300">Calling RoutePilot…</p>
        </div>
      )}

      {call.status === 'error' && (
        <div className="m-auto text-center">
          <p className="text-sm text-red-400">The call could not be completed.</p>
          <button
            type="button"
            onClick={start}
            className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            Try again
          </button>
        </div>
      )}

      {call.status === 'done' && (
        <div className="space-y-4 overflow-y-auto">
          <div className="rounded-lg border border-edge bg-card p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Call summary
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{call.res.summary}</p>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Unresolved items
            </div>
            <ul className="mt-2 space-y-1.5">
              {call.res.unresolved_items.map((u) => (
                <li key={u} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {u}
                </li>
              ))}
            </ul>
          </div>

          {intro.status !== 'sent' && (
            <div className="flex flex-wrap gap-2 border-t border-edge pt-3">
              {call.res.next_actions.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleAction(a)}
                  disabled={a === 'request_intro' && intro.status === 'sending'}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    a === 'request_intro'
                      ? 'bg-brand text-white hover:bg-brand-soft'
                      : 'border border-edge bg-card text-slate-300 hover:border-brand'
                  }`}
                >
                  {a === 'request_intro' && intro.status === 'sending'
                    ? 'Sending…'
                    : (ACTION_LABELS[a] ?? a)}
                </button>
              ))}
            </div>
          )}

          {waiting && intro.status !== 'sent' && (
            <div className="rounded-lg border border-edge bg-card p-3 text-xs text-slate-400">
              Noted — you'll be notified when the lead answers your open ticket.
            </div>
          )}

          {intro.status === 'error' && (
            <div className="text-xs text-red-400">Could not send the intro request.</div>
          )}

          {intro.status === 'sent' && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <div className="font-semibold">✓ Intro requested</div>
              <div className="mt-0.5 text-xs text-emerald-300/80">{intro.res.message}</div>
              <div className="mt-1 text-xs text-emerald-300/60">{intro.res.next_step}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
