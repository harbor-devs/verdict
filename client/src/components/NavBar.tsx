import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../lib/authContext'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const LINKS = [
  {
    to: '/',
    label: 'Home',
    short: 'Home',
    end: true,
    icon: (
      <Icon>
        <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </Icon>
    ),
  },
  {
    to: '/transactions',
    label: 'Activity',
    short: 'Activity',
    end: false,
    icon: (
      <Icon>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </Icon>
    ),
  },
  {
    to: '/budgets',
    label: 'Budgets',
    short: 'Budgets',
    end: false,
    icon: (
      <Icon>
        <path d="M12 3a9 9 0 1 0 9 9h-9z" />
      </Icon>
    ),
  },
  {
    to: '/goals',
    label: 'Goals',
    short: 'Goals',
    end: false,
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
      </Icon>
    ),
  },
  {
    to: '/afford',
    label: 'Can I afford it?',
    short: 'Afford',
    end: false,
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" />
      </Icon>
    ),
  },
]

export default function NavBar() {
  const { logout } = useAuth()

  return (
    <>
      {/* Phones: a slim top bar, and tabs along the bottom */}
      <header className="flex h-14 items-center justify-between border-b-2 border-edge px-5 md:hidden">
        <p className="font-display text-2xl font-extrabold tracking-tight">
          Verdict<span className="text-no">.</span>
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border-2 border-edge px-3 py-1.5 text-sm font-bold"
        >
          Log out
        </button>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t-2 border-edge bg-paper md:hidden"
      >
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-1 py-2.5 text-xs font-bold ${
                isActive ? 'bg-highlight text-ink' : 'text-muted'
              }`
            }
          >
            {link.icon}
            <span>{link.short}</span>
          </NavLink>
        ))}
      </nav>

      {/* Laptops: wordmark on top, folder tabs under it */}
       {/* Laptops: wordmark on top, folder tabs sitting on the page box */}
      <div className="hidden w-full shrink-0 md:block">
        <div className="mx-auto max-w-6xl px-14 pt-5">
          <div className="flex items-center justify-between pb-4">
            <p className="font-display text-4xl font-extrabold tracking-tight">
              Verdict<span className="text-no">.</span>
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="min-h-11 rounded-lg border-2 border-edge px-4 text-sm font-bold hover:bg-highlight"
            >
              Log out
            </button>
          </div>

          <nav aria-label="Pages">
            <ul className="flex gap-1.5 pl-3">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `block rounded-t-xl border-2 border-b-0 border-edge px-5 py-2.5 text-[15px] font-bold text-ink ${
                        isActive ? 'bg-highlight' : 'bg-tab hover:bg-highlight/50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>);}