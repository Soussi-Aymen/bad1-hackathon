import { useNavigate } from 'react-router-dom'
import { getDeals } from '../api'
import { useAsync } from '../hooks/useAsync'
import { eur } from '../format'
import { Pill } from '../components/Pill'

const ACTIVE_DEAL_ID = 'routepilot'

function FitBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : score >= 75
        ? 'bg-brand-tint text-brand border-brand/20'
        : 'bg-slate-100 text-slate-600 border-slate-200'
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
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-edge">
        <div
          className="h-full bg-brand-soft"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="text-xs text-muted">{pct}%</span>
    </div>
  )
}

export function OpportunitiesPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(getDeals)

  if (loading) {
    return <div className="animate-pulse text-sm text-faint">Loading opportunities…</div>
  }
  if (error || !data) {
    return <div className="text-sm text-red-600">Could not load opportunities.</div>
  }

  const sorted = [...data.deals].sort((a, b) => b.fit_score - a.fit_score)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Opportunities</h1>
          <p className="mt-1 text-sm text-muted">
            Every deal matched to your thesis, ranked by strategic fit.
          </p>
        </div>
        <div className="text-xs text-faint">
          {sorted.length} opportunit{sorted.length === 1 ? 'y' : 'ies'} · sorted by fit
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-edge bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-edge bg-panel text-left text-[10px] font-semibold uppercase tracking-wide text-faint">
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
                        <span className="font-semibold text-ink">{deal.masked_name}</span>
                        {!active && (
                          <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-faint">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <div className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                        {deal.one_liner}
                      </div>
                      <div className="mt-1.5 text-[11px] italic text-faint">
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
                    <td className="px-4 py-3 text-ink">{deal.stage}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      {eur(deal.round_size)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-accent">
                      {eur(deal.allocation_available)}
                    </td>
                    <td className="px-4 py-3 text-muted">{deal.lead_investor}</td>
                    <td className="px-4 py-3">
                      <DDBar pct={deal.dd_completion} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FitBadge score={deal.fit_score} />
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {deal.days_remaining}d
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deal.pending_tickets > 0 ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          {deal.pending_tickets}
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint">
        Click an active row to open the deal room. Other deals are visible but not yet diligenced.
      </p>
    </div>
  )
}
