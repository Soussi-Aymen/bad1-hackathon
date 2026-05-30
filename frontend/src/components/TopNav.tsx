import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Deals', end: true },
  { to: '/opportunities', label: 'Opportunities', end: false },
  { to: '/lead-view', label: 'Lead View', end: false },
]

const linkBase = 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors'

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-edge bg-card px-6 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white shadow-sm shadow-brand/30">
          DB
        </div>
        <span className="font-semibold tracking-tight text-ink">DealBridge</span>
        <span className="ml-1 rounded bg-panel px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
          Berlin
        </span>
      </div>

      <nav className="flex items-center gap-1 rounded-lg bg-panel/70 p-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-card text-brand shadow-sm'
                  : 'text-muted hover:text-ink'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
