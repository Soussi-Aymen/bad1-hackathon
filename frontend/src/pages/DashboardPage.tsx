import { getDeals } from '../api'
import { useAsync } from '../hooks/useAsync'
import { DealCard } from '../components/DealCard'

export function DashboardPage() {
  const { data, loading, error } = useAsync(getDeals)

  if (loading) {
    return <div className="animate-pulse text-sm text-slate-500">Loading deal flow…</div>
  }

  if (error || !data) {
    return <div className="text-sm text-red-400">Could not load deals.</div>
  }

  const { deals, portfolio_status } = data

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Deal Flow</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ranked by strategic fit with your thesis.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-edge bg-panel px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand/20 text-sm font-semibold text-brand-soft">
          {portfolio_status.current_positions}/{portfolio_status.recommended_minimum}
        </div>
        <p className="text-sm text-slate-300">{portfolio_status.message}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  )
}
