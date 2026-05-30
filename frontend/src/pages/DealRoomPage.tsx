import { Link } from 'react-router-dom'
import { getDealDetail } from '../api'
import { useAsync } from '../hooks/useAsync'
import { eur } from '../format'
import { Pill } from '../components/Pill'
import { Section } from '../components/Section'
import { DiligenceBadge, SeverityBadge, TrendIcon } from '../components/badges'

export function DealRoomPage() {
  const { data: deal, loading, error } = useAsync(getDealDetail)

  if (loading) {
    return <div className="animate-pulse text-sm text-slate-500">Loading deal room…</div>
  }
  if (error || !deal) {
    return <div className="text-sm text-red-400">Could not load deal.</div>
  }

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link to="/" className="text-xs text-slate-400 hover:text-slate-200">
        ← Back to deal flow
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">{deal.masked_name}</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">{deal.one_liner}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {deal.sector_tags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>{deal.stage}</span>
            <span>Founded {deal.founded}</span>
            <span>{deal.team_size} people</span>
            <span>{deal.location}</span>
          </div>
        </div>

        {/* Round terms card */}
        <div className="w-full max-w-xs rounded-xl border border-edge bg-panel p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Round terms
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <div className="text-[10px] uppercase text-slate-500">Size</div>
              <div className="font-semibold text-white">{eur(deal.round.size)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Allocation</div>
              <div className="font-semibold text-accent">{eur(deal.round.allocation_available)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Min ticket</div>
              <div className="font-semibold text-white">{eur(deal.round.min_ticket)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Closes in</div>
              <div className="font-semibold text-white">{deal.round.days_remaining} days</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] uppercase text-slate-500">Valuation</div>
              <div className="font-semibold text-white">{deal.round.valuation_type}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] uppercase text-slate-500">Lead investor</div>
              <div className="font-semibold text-white">{deal.round.lead_investor}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw DD isolation note */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-slate-300">
        <span className="mt-0.5">🔒</span>
        <span>
          Original diligence files are protected — ask the Agent for approved answers.
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <Section title="Overview">
          <p className="text-sm leading-relaxed text-slate-300">{deal.overview}</p>
        </Section>

        <Section title="Market">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase text-slate-500">TAM</div>
              <div className="mt-0.5 text-sm text-slate-200">{deal.market.tam}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Segment</div>
              <div className="mt-0.5 text-sm text-slate-200">{deal.market.segment}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Trends</div>
              <div className="mt-0.5 text-sm text-slate-200">{deal.market.trends}</div>
            </div>
          </div>
        </Section>

        <Section title="Traction">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {deal.traction.metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-edge bg-panel p-3">
                <div className="flex items-center gap-1.5 text-base font-semibold text-white">
                  {m.value} <TrendIcon trend={m.trend} />
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{m.label}</div>
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
                <div className="text-[10px] uppercase text-slate-500">{label}</div>
                <div className="text-lg font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Team">
          <div className="grid gap-3 sm:grid-cols-3">
            {deal.team.map((member, i) => (
              <div key={i} className="rounded-lg border border-edge bg-panel p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{member.role}</span>
                  {member.name_masked && (
                    <span className="rounded bg-card px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
                      Name masked
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {member.background}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Lead thesis" aside={<span className="text-xs text-slate-500">{deal.lead_thesis.title}</span>}>
          <p className="text-sm leading-relaxed text-slate-300">{deal.lead_thesis.content}</p>
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Open questions from the lead
            </div>
            <ul className="mt-2 space-y-1.5">
              {deal.lead_thesis.open_questions_from_lead.map((q) => (
                <li key={q} className="flex gap-2 text-sm text-slate-300">
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
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </span>
          }
        >
          <div className="space-y-2.5">
            {deal.strategic_fit.dimensions.map((d) => (
              <div key={d.dimension}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200">{d.dimension}</span>
                  <span className="text-slate-400">{d.score}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-panel">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${d.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{d.explanation}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-edge bg-panel p-3 text-sm text-slate-300">
            <span className="font-semibold text-white">What you contribute: </span>
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
                  <div className="text-sm text-slate-200">{d.item}</div>
                  {d.note && <div className="text-xs text-slate-500">{d.note}</div>}
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
                  <span className="font-medium text-white">{r.risk}</span>
                  <SeverityBadge severity={r.severity} />
                </div>
                <p className="mt-1 text-sm text-slate-400">{r.detail}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  <span className="text-slate-400">Resolves with: </span>
                  {r.what_resolves_it}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Talk to deal agent — wired up in F4 */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-20 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-soft"
      >
        💬 Talk to deal agent
      </button>
    </div>
  )
}
