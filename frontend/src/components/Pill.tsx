import type { ReactNode } from 'react'

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-edge bg-card px-2.5 py-0.5 text-xs font-medium text-slate-300">
      {children}
    </span>
  )
}
