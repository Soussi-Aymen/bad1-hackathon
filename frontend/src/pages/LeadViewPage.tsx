import { getLeadView } from '../api'
import { useAsync } from '../hooks/useAsync'
import type { ReactNode } from 'react'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-edge bg-card p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
        {title}
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const answered = status === 'answered'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        answered
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {status}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-edge bg-card px-3 py-2 text-center shadow-sm">
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-faint">{label}</div>
    </div>
  )
}

export function LeadViewPage() {
  const { data, loading, error } = useAsync(getLeadView)

  if (loading) {
    return <div className="animate-pulse text-sm text-faint">Loading lead view…</div>
  }
  if (error || !data) {
    return <div className="text-sm text-red-600">Could not load lead view.</div>
  }

  const { deal, investor, questions_asked, tickets, voice_call_summary, intro_request, summary_stats } =
    data

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">Lead View — {deal.name}</h1>
          <p className="mt-1 text-sm text-muted">
            What {deal.lead_investor} sees about this investor's engagement.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            summary_stats.intro_requested
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-edge bg-card text-muted'
          }`}
        >
          {summary_stats.intro_requested ? 'Intro requested' : 'No intro yet'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Questions" value={summary_stats.questions_asked} />
        <Stat label="Open tickets" value={summary_stats.tickets_open} />
        <Stat label="Answered" value={summary_stats.tickets_answered} />
        <Stat label="Voice calls" value={summary_stats.voice_calls} />
        <Stat label="Intro" value={summary_stats.intro_requested ? 'Yes' : '—'} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Investor">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-ink">{investor.name}</div>
              <div className="text-xs text-muted">{investor.company}</div>
              <div className="text-xs text-faint">{investor.role}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-soft">{investor.fit_score}</div>
              <div className="text-[10px] uppercase tracking-wide text-faint">Fit</div>
            </div>
          </div>
          <ul className="mt-3 space-y-1">
            {investor.strategic_assets.map((a) => (
              <li key={a} className="flex gap-2 text-xs text-muted">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-soft" />
                {a}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Questions asked">
          {questions_asked.length === 0 ? (
            <p className="text-sm text-faint">No questions asked yet.</p>
          ) : (
            <ul className="space-y-2">
              {questions_asked.map((q, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-muted">{q.question}</span>
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Clarification tickets">
          {tickets.length === 0 ? (
            <p className="text-sm text-faint">No tickets raised.</p>
          ) : (
            <ul className="space-y-2.5">
              {tickets.map((t) => (
                <li key={t.ticket_id} className="border-b border-edge/60 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-ink">{t.question}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  {t.answer && (
                    <p className="mt-1 text-xs text-muted">
                      <span className="text-faint">Lead: </span>
                      {t.answer}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Voice call & intro">
          {voice_call_summary ? (
            <p className="text-sm leading-relaxed text-muted">{voice_call_summary.summary}</p>
          ) : (
            <p className="text-sm text-faint">No voice call on record.</p>
          )}
          <div className="mt-3 border-t border-edge pt-3 text-sm">
            <span className="text-faint">Intro request: </span>
            {intro_request ? (
              <span className="font-medium text-emerald-700">{intro_request.status}</span>
            ) : (
              <span className="text-muted">none</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
