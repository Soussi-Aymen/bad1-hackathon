import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getDealDetail } from '../api'
import { useAsync } from '../hooks/useAsync'
import { eur } from '../format'
import { Pill } from '../components/Pill'
import { Section } from '../components/Section'
import { DiligenceBadge, SeverityBadge, TrendIcon } from '../components/badges'
import { AgentPanel } from '../components/AgentPanel'

type IntroStep = 'idle' | 'open' | 'email-sent' | 'calendar-sent'

function IntroModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<IntroStep>('open')

  const confirmed = step === 'email-sent' || step === 'calendar-sent'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">Request Intro</h2>
            <p className="mt-0.5 text-xs text-muted">Connect with the opportunity poster</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-faint transition hover:bg-panel hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {confirmed ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <div className="text-2xl">✓</div>
              <p className="mt-2 font-semibold text-emerald-800">
                {step === 'email-sent' ? 'Email sent!' : 'Meeting booked!'}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {step === 'email-sent'
                  ? 'Your intro request has been sent. The lead investor will be in touch within 24 hours.'
                  : 'A calendar invite has been sent. Check your inbox to confirm the slot.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                Choose how you'd like to connect with the lead investor for this opportunity.
              </p>

              <div className="mt-4 space-y-3">
                {/* Email option */}
                <button
                  type="button"
                  onClick={() => setStep('email-sent')}
                  className="group flex w-full items-center gap-4 rounded-xl border border-edge bg-panel px-4 py-3.5 text-left transition hover:border-brand/40 hover:bg-brand-tint"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-xl shadow-sm">
                    ✉️
                  </div>
                  <div>
                    <div className="font-medium text-ink">Contact via Email</div>
                    <div className="text-xs text-muted">Send a brief intro note to the lead</div>
                  </div>
                  <span className="ml-auto text-faint transition group-hover:text-brand">→</span>
                </button>

                {/* Calendar option */}
                <button
                  type="button"
                  onClick={() => setStep('calendar-sent')}
                  className="group flex w-full items-center gap-4 rounded-xl border border-edge bg-panel px-4 py-3.5 text-left transition hover:border-brand/40 hover:bg-brand-tint"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-xl shadow-sm">
                    📅
                  </div>
                  <div>
                    <div className="font-medium text-ink">Book via Calendar</div>
                    <div className="text-xs text-muted">Schedule a 30-min intro call</div>
                  </div>
                  <span className="ml-auto text-faint transition group-hover:text-brand">→</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export function DealRoomPage() {
  const { data: deal, loading, error } = useAsync(getDealDetail)
  const [agentOpen, setAgentOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)

  if (loading) {
    return <div className="animate-pulse text-sm text-faint">Loading deal room…</div>
  }
  if (error || !deal) {
    return <div className="text-sm text-red-600">Could not load deal.</div>
  }

  const invested = deal.round.size - deal.round.allocation_available
  const investedPct = Math.min(100, Math.max(0, (invested / deal.round.size) * 100))

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link to="/" className="text-xs text-muted hover:text-ink">
        ← Back to deal flow
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink">{deal.masked_name}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">{deal.one_liner}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {deal.sector_tags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
            <span>{deal.stage}</span>
            <span>Founded {deal.founded}</span>
            <span>{deal.team_size} people</span>
            <span>{deal.location}</span>
          </div>
        </div>

        {/* Round terms card */}
        <div className="w-full max-w-xs rounded-xl border border-edge bg-card p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">
            Round terms
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <div className="text-[10px] uppercase text-faint">Size</div>
              <div className="font-semibold text-ink">{eur(deal.round.size)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-faint">Allocation</div>
              <div className="font-semibold text-accent">{eur(deal.round.allocation_available)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-faint">Min ticket</div>
              <div className="font-semibold text-ink">{eur(deal.round.min_ticket)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-faint">Closes in</div>
              <div className="font-semibold text-ink">{deal.round.days_remaining} days</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] uppercase text-faint">Valuation</div>
              <div className="font-semibold text-ink">{deal.round.valuation_type}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] uppercase text-faint">Lead investor</div>
              <div className="font-semibold text-ink">{deal.round.lead_investor}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment progress + Request Intro */}
      <div className="mt-4 rounded-xl border border-edge bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Investment progress</span>
              <span className="text-faint">
                {eur(invested)} raised of {eur(deal.round.size)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-edge">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-soft transition-all duration-500"
                style={{ width: `${investedPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-faint">
              <span>{Math.round(investedPct)}% filled</span>
              <span className="text-accent font-medium">{eur(deal.round.allocation_available)} remaining</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIntroOpen(true)}
            className="ml-2 shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/25 transition hover:bg-brand-soft active:scale-95"
          >
            Request Intro
          </button>
        </div>
      </div>

      {/* Raw DD isolation note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-brand/15 bg-brand-tint px-4 py-3 text-sm text-ink">
        <span className="mt-0.5">🔒</span>
        <span>
          Original diligence files are protected — ask the Agent for approved answers.
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <Section title="Overview">
          <p className="text-sm leading-relaxed text-muted">{deal.overview}</p>
        </Section>

        <Section title="Market">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase text-faint">TAM</div>
              <div className="mt-0.5 text-sm text-ink">{deal.market.tam}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-faint">Segment</div>
              <div className="mt-0.5 text-sm text-ink">{deal.market.segment}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-faint">Trends</div>
              <div className="mt-0.5 text-sm text-ink">{deal.market.trends}</div>
            </div>
          </div>
        </Section>

        <Section title="Traction">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {deal.traction.metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-edge bg-panel p-3">
                <div className="flex items-center gap-1.5 text-base font-semibold text-ink">
                  {m.value} <TrendIcon trend={m.trend} />
                </div>
                <div className="mt-0.5 text-xs text-faint">{m.label}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Financial snapshot">
          <div className="flex flex-wrap gap-6">
            {[
              ['ARR', deal.financials_snapshot.arr],
              ['Gross margin', deal.financials_snapshot.gross_margin],
              ['CAC payback', deal.financials_snapshot.cac_payback],
              ['LTV : CAC', deal.financials_snapshot.ltv_cac_ratio],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] uppercase text-faint">{label}</div>
                <div className="text-lg font-semibold text-ink">{value}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Team">
          <div className="grid gap-3 sm:grid-cols-3">
            {deal.team.map((member, i) => (
              <div key={i} className="rounded-lg border border-edge bg-panel p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{member.role}</span>
                  {member.name_masked && (
                    <span className="rounded bg-card px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-faint">
                      Name masked
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {member.background}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Lead thesis" aside={<span className="text-xs text-faint">{deal.lead_thesis.title}</span>}>
          <p className="text-sm leading-relaxed text-muted">{deal.lead_thesis.content}</p>
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              Open questions from the lead
            </div>
            <ul className="mt-2 space-y-1.5">
              {deal.lead_thesis.open_questions_from_lead.map((q) => (
                <li key={q} className="flex gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          title="Strategic fit"
          aside={
            <span className="text-lg font-bold text-brand-soft">
              {deal.strategic_fit.overall_score}
              <span className="text-xs font-normal text-faint"> / 100</span>
            </span>
          }
        >
          <div className="space-y-2.5">
            {deal.strategic_fit.dimensions.map((d) => (
              <div key={d.dimension}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{d.dimension}</span>
                  <span className="text-muted">{d.score}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-edge">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${d.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-faint">{d.explanation}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border-l-2 border-brand/40 bg-brand-tint p-3 text-sm text-muted">
            <span className="font-semibold text-ink">What you contribute: </span>
            {deal.strategic_fit.what_you_contribute}
          </div>
        </Section>

        <Section title="Diligence status">
          <ul className="space-y-2">
            {deal.diligence_status.map((d) => (
              <li
                key={d.item}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-ink">{d.item}</div>
                  {d.note && <div className="text-xs text-faint">{d.note}</div>}
                </div>
                <DiligenceBadge status={d.status} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Risks">
          <div className="space-y-3">
            {deal.risks.map((r) => (
              <div key={r.risk} className="rounded-lg border border-edge bg-panel p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{r.risk}</span>
                  <SeverityBadge severity={r.severity} />
                </div>
                <p className="mt-1 text-sm text-muted">{r.detail}</p>
                <p className="mt-1.5 text-xs text-faint">
                  <span className="text-muted">Resolves with: </span>
                  {r.what_resolves_it}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Talk to deal agent */}
      <button
        type="button"
        onClick={() => setAgentOpen(true)}
        className="fixed bottom-6 right-6 z-20 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-soft"
      >
        💬 Talk to deal agent
      </button>

      <AgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />

      {introOpen && <IntroModal onClose={() => setIntroOpen(false)} />}
    </div>
  )
}
