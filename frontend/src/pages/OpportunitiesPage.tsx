import { useNavigate } from 'react-router-dom'
import { getDeals } from '../api'
import { useAsync } from '../hooks/useAsync'
import { eur } from '../format'
import { Pill } from '../components/Pill'

const ACTIVE_DEAL_ID = 'routepilot'

function FitBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : score >= 75
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-semibold ${tone}`}
    >
      {score}
    </span>
  )
}

function DDBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel">
        <div
          className="h-full bg-brand-soft"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{pct}%</span>
    </div>
  )
}

export function OpportunitiesPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(getDeals)

  if (loading) {
    return <div className="animate-pulse text-sm text-slate-500">Loading opportunities…</div>
  }
  if (error || !data) {
    return <div className="text-sm text-red-400">Could not load opportunities.</div>
  }

  const sorted = [...data.deals].sort((a, b) => b.fit_score - a.fit_score)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Opportunities</h1>
          <p className="mt-1 text-sm text-slate-400">
            Every deal matched to your thesis, ranked by strategic fit.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {sorted.length} opportunit{sorted.length === 1 ? 'y' : 'ies'} · sorted by fit
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-edge bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-panel text-left text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Sectors</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 text-right font-medium">Round</th>
                <th className="px-4 py-3 text-right font-medium">Allocation</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">DD</th>
                <th className="px-4 py-3 text-center font-medium">Fit</th>
                <th className="px-4 py-3 text-right font-medium">Closes</th>
                <th className="px-4 py-3 text-right font-medium">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((deal) => {
                const active = deal.id === ACTIVE_DEAL_ID
                return (
                  <tr
                    key={deal.id}
                    onClick={() => active && navigate(`/deals/${deal.id}`)}
                    className={[
                      'border-t border-edge align-top transition',
                      active
                        ? 'cursor-pointer hover:bg-panel'
                        : 'cursor-default opacity-60',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{deal.masked_name}</span>
                        {!active && (
                          <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <div className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                        {deal.one_liner}
                      </div>
                      <div className="mt-1.5 text-[11px] italic text-slate-500">
                        {deal.fit_reason}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {deal.sector_tags.map((t) => (
                          <Pill key={t}>{t}</Pill>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{deal.stage}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-200">
                      {eur(deal.round_size)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-accent">
                      {eur(deal.allocation_available)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{deal.lead_investor}</td>
                    <td className="px-4 py-3">
                      <DDBar pct={deal.dd_completion} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FitBadge score={deal.fit_score} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {deal.days_remaining}d
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deal.pending_tickets > 0 ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                          {deal.pending_tickets}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Click an active row to open the deal room. Other deals are visible but not yet diligenced.
      </p>
    </div>
  )
}
