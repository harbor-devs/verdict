import { NavLink } from 'react-router'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/transactions', label: 'Transactions', end: false },
  { to: '/budgets', label: 'Budgets', end: false },
  { to: '/goals', label: 'Goals', end: false },
  { to: '/afford', label: 'Afford it?', end: false },
]

export default function NavBar() {
  return (
    <nav aria-label="Main" className="border-b border-dashed border-line bg-paper">
      <ul className="mx-auto flex max-w-md gap-1 overflow-x-auto px-3 py-2">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}