import { useNavigate } from 'react-router-dom'
import type { DealCard as DealCardType } from '../types'
import { eur } from '../format'
import { Pill } from './Pill'

// Only RoutePilot has a full deal room; the other cards are decorative (plan §2).
const ACTIVE_DEAL_ID = 'routepilot'

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-sm font-semibold ${accent ? 'text-accent' : 'text-slate-200'}`}>
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
        'flex w-full flex-col rounded-xl border border-edge bg-card p-5 text-left transition',
        active
          ? 'cursor-pointer hover:border-brand hover:shadow-lg hover:shadow-brand/10'
          : 'cursor-default opacity-55',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{deal.masked_name}</h3>
            {!active && (
              <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                Coming soon
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{deal.one_liner}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold text-brand-soft">{deal.fit_score}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Fit</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {deal.sector_tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-edge pt-4">
        <Stat label="Stage" value={deal.stage} />
        <Stat label="Round" value={eur(deal.round_size)} />
        <Stat label="Allocation" value={eur(deal.allocation_available)} accent />
        <Stat label="Lead" value={deal.lead_investor} />
        <Stat label="DD complete" value={`${deal.dd_completion}%`} />
        <Stat label="Closes in" value={`${deal.days_remaining}d`} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-edge pt-3">
        <p className="text-xs italic leading-relaxed text-slate-500">{deal.fit_reason}</p>
        {deal.pending_tickets > 0 && (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            {deal.pending_tickets} open ticket{deal.pending_tickets > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  )
}
