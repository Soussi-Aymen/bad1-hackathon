import type { ReactNode } from 'react'

export function Section({
  title,
  children,
  aside,
}: {
  title: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="rounded-xl border border-edge bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
