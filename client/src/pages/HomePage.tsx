import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { ScoreResponse, SummaryResponse } from '../api/types'
import { Card, PageHeader } from '../components/CaseFile'
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

// Joke wording that only lives on this screen. The score itself comes from the server.
function caseStatus(score: ScoreResponse['score']): string {
  if (score.status !== 'ok') return 'Pending'
  const words = { solid: 'Acquitted', okay: 'Cleared', shaky: 'On probation', rough: 'Guilty' }
  return words[score.band]
}

export default function HomePage() {
  const { user } = useAuth()
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
    <main className="mx-auto flex w-full max-w-6xl flex-col px-5 py-5 md:px-14">
      <PageHeader
        label="The overview"
        title={`Hi, ${user?.displayName}.`}
        note="the court is in session"
      />

      {state.kind === 'loading' && <p className="text-base text-muted">Counting your money...</p>}

      {state.kind === 'error' && (
        <div role="alert" className="rounded-[10px] border-2 border-no bg-card p-6">
          <p className="text-base text-no">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              setState({ kind: 'loading' })
              setReloadKey((key) => key + 1)
            }}
            className="mt-4 rounded-md bg-ink px-5 py-2.5 text-base font-bold text-paper"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === 'ready' && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-0.5 border-2 border-edge bg-edge md:grid-cols-4">
            {[
              { label: 'Case no.', value: state.summary.month, hot: false },
              { label: 'Filed', value: formatMonth(state.summary.month), hot: false },
              { label: 'Defendant', value: user?.displayName ?? '', hot: false },
              { label: 'Status', value: caseStatus(state.score), hot: true },
            ].map((cell) => (
              <div
                key={cell.label}
                className={`px-4 py-2 ${cell.hot ? 'bg-highlight text-ink' : 'bg-card'}`}
              >
                <dt
                  className={`font-receipt text-xs tracking-widest uppercase ${
                    cell.hot ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {cell.label}
                </dt>
                <dd className="truncate font-receipt text-sm font-bold uppercase">{cell.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-9 pt-3 md:grid-cols-[1.5fr_1fr] md:gap-10">
            <ScoreCard score={state.score} />

            <div className="space-y-6">
              <Card tab="Exhibit A">
                <p className="text-sm text-muted">Balance, all time</p>
                <p
                  className={`mt-1 font-display text-3xl font-extrabold break-words sm:text-4xl ${
                    state.summary.balance.startsWith('-') ? 'text-no' : ''
                  }`}
                >
                  {formatMoney(state.summary.balance, currency)}
                </p>
                <p className="mt-1 text-sm text-muted">All income minus all spending.</p>
              </Card>

                    <div className="space-y-6">
                <Card tab="Exhibit B">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm text-muted">Income this month</p>
                    <p className="font-display text-xl font-extrabold text-yes">
                      {formatMoney(state.summary.monthIncome, currency)}
                    </p>
                  </div>
                </Card>
                <Card tab="Exhibit C">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm text-muted">Spent this month</p>
                    <p className="font-display text-xl font-extrabold">
                      {formatMoney(state.summary.monthExpenses, currency)}
                    </p>
                  </div>
                </Card>
              </div>

              {state.summary.monthIncome === '0.00' && state.summary.monthExpenses === '0.00' && (
                <p className="text-sm text-muted">Nothing logged this month yet.</p>
              )}

              {state.score.status === 'ok' && state.score.tips.length > 0 && (
                <aside className="-rotate-1 border-2 border-edge bg-highlight p-4 text-ink shadow-hard">
                  <p className="font-receipt text-xs font-bold tracking-widest uppercase">
                    Witness statement
                  </p>
                  <ul className="mt-1 space-y-1 text-base font-medium">
                    {state.score.tips.slice(0, 2).map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </aside>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}