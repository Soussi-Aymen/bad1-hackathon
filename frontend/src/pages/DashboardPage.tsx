import { Link } from 'react-router-dom'
import { getDeals } from '../api'
import { useAsync } from '../hooks/useAsync'
import { DealCard } from '../components/DealCard'

export function DashboardPage() {
  const { data, loading, error } = useAsync(getDeals)

  if (loading) {
    return <div className="animate-pulse text-sm text-faint">Loading deal flow…</div>
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">Could not load deals.</div>
  }

  const { deals, portfolio_status } = data
  const topDeals = [...deals].sort((a, b) => b.fit_score - a.fit_score).slice(0, 5)
  const remaining = deals.length - topDeals.length

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Deal Flow</h1>
          <p className="mt-1 text-sm text-muted">
            Top {topDeals.length} matches ranked by strategic fit with your thesis.
          </p>
        </div>
        {remaining > 0 && (
          <Link
            to="/opportunities"
            className="shrink-0 rounded-md border border-edge bg-card px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand/40 hover:text-brand"
          >
            See all {deals.length} opportunities →
          </Link>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand/15 bg-brand-tint px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/30">
          {portfolio_status.current_positions}/{portfolio_status.recommended_minimum}
        </div>
        <p className="text-sm text-ink">{portfolio_status.message}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {topDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  )
}
