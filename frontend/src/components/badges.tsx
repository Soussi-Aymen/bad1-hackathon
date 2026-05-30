import type { DiligenceStatus, MetricTrend, RiskSeverity } from '../types'

const dot = 'mr-1.5 inline-block h-1.5 w-1.5 rounded-full'
const base =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium'

const DILIGENCE: Record<DiligenceStatus, { cls: string; dot: string; label: string }> = {
  verified: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-400', label: 'Verified' },
  pending: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', dot: 'bg-amber-400', label: 'Pending' },
  flagged: { cls: 'border-red-500/30 bg-red-500/10 text-red-300', dot: 'bg-red-400', label: 'Flagged' },
}

export function DiligenceBadge({ status }: { status: DiligenceStatus }) {
  const s = DILIGENCE[status] ?? DILIGENCE.pending
  return (
    <span className={`${base} ${s.cls}`}>
      <span className={`${dot} ${s.dot}`} />
      {s.label}
    </span>
  )
}

const SEVERITY: Record<RiskSeverity, { cls: string; label: string }> = {
  high: { cls: 'border-red-500/30 bg-red-500/10 text-red-300', label: 'High' },
  medium: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', label: 'Medium' },
  low: { cls: 'border-slate-500/30 bg-slate-500/10 text-slate-300', label: 'Low' },
}

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  const s = SEVERITY[severity] ?? SEVERITY.medium
  return <span className={`${base} ${s.cls}`}>{s.label} risk</span>
}

const TREND: Record<MetricTrend, { glyph: string; cls: string }> = {
  up: { glyph: '▲', cls: 'text-emerald-400' },
  down: { glyph: '▼', cls: 'text-red-400' },
  stable: { glyph: '▬', cls: 'text-slate-500' },
}

export function TrendIcon({ trend }: { trend: MetricTrend }) {
  const t = TREND[trend] ?? TREND.stable
  return <span className={`text-[10px] ${t.cls}`}>{t.glyph}</span>
}
