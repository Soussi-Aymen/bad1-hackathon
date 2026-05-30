import { getInvestor } from '../api'
import { useAsync } from '../hooks/useAsync'
import { Pill } from './Pill'

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatRange(min: number, max: number): string {
  const k = (n: number) => `€${Math.round(n / 1000)}k`
  return `${k(min)} – ${k(max)}`
}

export function InvestorPanel() {
  const { data: investor, loading, error } = useAsync(getInvestor)

  if (loading) {
    return (
      <aside className="w-72 shrink-0 border-r border-edge bg-card p-5">
        <div className="animate-pulse text-sm text-faint">Loading investor…</div>
      </aside>
    )
  }

  if (error || !investor) {
    return (
      <aside className="w-72 shrink-0 border-r border-edge bg-card p-5">
        <div className="text-sm text-red-600">Could not load investor profile.</div>
      </aside>
    )
  }

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-edge bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          {initials(investor.name)}
        </div>
        <div>
          <div className="font-semibold text-ink">{investor.name}</div>
          <div className="text-xs text-muted">{investor.company}</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted">{investor.role}</div>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
          Sector expertise
        </div>
        <div className="flex flex-wrap gap-1.5">
          {investor.sector_expertise.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">
          Ticket range
        </div>
        <div className="mt-0.5 text-sm text-muted">
          {formatRange(investor.ticket_range.min, investor.ticket_range.max)}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
          Strategic assets
        </div>
        <ul className="space-y-1.5">
          {investor.strategic_assets.map((a) => (
            <li key={a} className="flex gap-2 text-xs leading-relaxed text-muted">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-soft" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-lg border border-edge bg-panel p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">
          Portfolio
        </div>
        <div className="mt-1 text-sm text-muted">
          {investor.portfolio_count} of {investor.portfolio_target} target positions
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-brand"
            style={{
              width: `${Math.min(100, (investor.portfolio_count / investor.portfolio_target) * 100)}%`,
            }}
          />
        </div>
      </div>
    </aside>
  )
}
