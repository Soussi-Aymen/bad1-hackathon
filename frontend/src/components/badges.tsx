import type { DiligenceStatus, MetricTrend, RiskSeverity } from '../types'

const dot = 'mr-1.5 inline-block h-1.5 w-1.5 rounded-full'
const base =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium'

const DILIGENCE: Record<DiligenceStatus, { cls: string; dot: string; label: string }> = {
  verified: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Verified' },
  pending: { cls: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
  flagged: { cls: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Flagged' },
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
  high: { cls: 'border-red-200 bg-red-50 text-red-700', label: 'High' },
  medium: { cls: 'border-amber-200 bg-amber-50 text-amber-700', label: 'Medium' },
  low: { cls: 'border-slate-200 bg-slate-100 text-slate-600', label: 'Low' },
}

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  const s = SEVERITY[severity] ?? SEVERITY.medium
  return <span className={`${base} ${s.cls}`}>{s.label} risk</span>
}

const TREND: Record<MetricTrend, { glyph: string; cls: string }> = {
  up: { glyph: '▲', cls: 'text-emerald-600' },
  down: { glyph: '▼', cls: 'text-red-600' },
  stable: { glyph: '▬', cls: 'text-faint' },
}

export function TrendIcon({ trend }: { trend: MetricTrend }) {
  const t = TREND[trend] ?? TREND.stable
  return <span className={`text-[10px] ${t.cls}`}>{t.glyph}</span>
}
