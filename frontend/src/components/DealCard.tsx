import { useNavigate } from 'react-router-dom'
import type { DealCard as DealCardType } from '../types'
import { eur } from '../format'
import { Pill } from './Pill'

// Only RoutePilot has a full deal room; the other cards are decorative (plan §2).
const ACTIVE_DEAL_ID = 'routepilot'

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-faint">{label}</div>
      <div className={`text-sm font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  )
}

export function DealCard({ deal }: { deal: DealCardType }) {
  const navigate = useNavigate()
  const active = deal.id === ACTIVE_DEAL_ID

  const go = () => {
    if (active) navigate(`/deals/${deal.id}`)
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={!active}
      className={[
        'group flex w-full flex-col rounded-xl border bg-card p-5 text-left shadow-sm transition',
        active
          ? 'cursor-pointer border-edge hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md hover:shadow-brand/10'
          : 'cursor-default border-edge opacity-60',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink">{deal.masked_name}</h3>
            {!active && (
              <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                Coming soon
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{deal.one_liner}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-lg bg-brand-tint px-3 py-1.5">
          <div className="text-xl font-bold leading-none text-brand">{deal.fit_score}</div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-brand/70">Fit</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {deal.sector_tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4 border-t border-edge pt-4">
        <Stat label="Stage" value={deal.stage} />
        <Stat label="Round" value={eur(deal.round_size)} />
        <Stat label="Allocation" value={eur(deal.allocation_available)} accent />
        <Stat label="Lead" value={deal.lead_investor} />
        <Stat label="DD complete" value={`${deal.dd_completion}%`} />
        <Stat label="Closes in" value={`${deal.days_remaining}d`} />
      </div>

      <div className="mt-4 rounded-lg border-l-2 border-brand/40 bg-panel/60 px-3 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand/70">Why it fits</div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{deal.fit_reason}</p>
      </div>

      {deal.pending_tickets > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            {deal.pending_tickets} open ticket{deal.pending_tickets > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </button>
  )
}
