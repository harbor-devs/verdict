import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { ScoreResponse, SummaryResponse } from '../api/types'
import ScoreCard from '../components/ScoreCard'
import { useAuth } from '../lib/authContext'
import { formatMonth, formatMoney } from '../lib/format'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      summary: SummaryResponse['summary']
      score: ScoreResponse['score']
    }

export default function HomePage() {
  const { user, logout } = useAuth()
  const [state, setState] = useState<State>({ kind: 'loading' })
  // Changing this number makes the data load again (used by the Try again button)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // If the screen closes before the answer arrives, we ignore the answer
    let cancelled = false

    Promise.all([api<SummaryResponse>('/api/summary'), api<ScoreResponse>('/api/score')])
      .then(([summaryRes, scoreRes]) => {
        if (!cancelled) {
          setState({ kind: 'ready', summary: summaryRes.summary, score: scoreRes.score })
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof ApiError ? error.message : 'Something went wrong. Try again.'
        setState({ kind: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const currency = user?.currency ?? 'PKR'

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <header className="flex items-center justify-between">
        <p className="font-display text-2xl font-bold tracking-tight">
          Verdict<span className="text-yes">.</span>
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium"
        >
          Log out
        </button>
      </header>

      <h1 className="mt-6 font-display text-3xl font-bold">Hi, {user?.displayName}.</h1>

      {state.kind === 'loading' && <p className="mt-6 text-muted">Counting your money...</p>}

      {state.kind === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl border border-no bg-card p-5">
          <p className="text-no">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              setState({ kind: 'loading' })
              setReloadKey((key) => key + 1)
            }}
            className="mt-3 rounded-lg bg-ink px-4 py-2 font-medium text-paper"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === 'ready' && (
        <div className="mt-5 space-y-4">
          <section className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm text-muted">Balance</p>
            <p
              className={`mt-1 font-mono text-4xl font-medium ${
                state.summary.balance.startsWith('-') ? 'text-no' : ''
              }`}
            >
              {formatMoney(state.summary.balance, currency)}
            </p>
            <p className="mt-1 text-sm text-muted">All income minus all spending.</p>
          </section>

          <section className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-display text-xl font-bold">{formatMonth(state.summary.month)}</h2>
            <dl className="mt-3 divide-y divide-dashed divide-line border-y border-dashed border-line">
              <div className="flex items-center justify-between py-2.5">
                <dt>Income</dt>
                <dd className="font-mono">{formatMoney(state.summary.monthIncome, currency)}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt>Spending</dt>
                <dd className="font-mono">{formatMoney(state.summary.monthExpenses, currency)}</dd>
              </div>
            </dl>
            {state.summary.monthIncome === '0.00' && state.summary.monthExpenses === '0.00' && (
              <p className="mt-3 text-sm text-muted">Nothing logged this month yet.</p>
            )}
          </section>

          <ScoreCard score={state.score} />
        </div>
      )}
    </main>
  )
}