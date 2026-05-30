import { NavLink } from 'react-router-dom'

const linkBase =
  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors'

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-edge bg-panel px-5 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
          DB
        </div>
        <span className="font-semibold text-white">DealBridge</span>
        <span className="ml-1 rounded bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
          Berlin
        </span>
      </div>

      <nav className="flex items-center gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-card'}`
          }
        >
          Deals
        </NavLink>
        <NavLink
          to="/lead-view"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-card'}`
          }
        >
          Lead View
        </NavLink>
      </nav>
    </header>
  )
}
