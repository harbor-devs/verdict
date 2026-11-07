import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../api/client'
import type { Budget, BudgetsResponse } from '../api/types'
import BudgetForm from '../components/BudgetForm'
import { useAuth } from '../lib/authContext'
import { formatMoney } from '../lib/format'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: Budget[] }

// Display only: works out the bar width and the colour. The server still decides the score.
function usage(item: Budget) {
  const spent = Number(item.spentThisMonth)
  const limit = Number(item.monthlyLimit)
  const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const over = spent > limit
  const near = !over && percent >= 80
  return { percent, over, near }
}

export default function BudgetsPage() {
  const { user } = useAuth()
  const [state, setState] = useState<State>({ kind: 'loading' })
  // Changing this number makes the list load again (after saving or deleting one)
  const [reloadKey, setReloadKey] = useState(0)
  // The row that is showing "Yes, delete / Keep"
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // The row that is being deleted right now
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    // If the screen closes before the answer arrives, we ignore the answer
    let cancelled = false

    api<BudgetsResponse>('/api/budgets')
      .then((res) => {
        if (!cancelled) setState({ kind: 'ready', items: res.budgets })
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

  async function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteError('')

    try {
      await api(`/api/budgets/${id}`, { method: 'DELETE' })
      setConfirmingId(null)
      setReloadKey((key) => key + 1)
    } catch (error) {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Could not delete that. Try again.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const currency = user?.currency ?? 'PKR'

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <Link to="/" className="text-sm font-medium underline underline-offset-4">
        Back to Home
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">Budgets</h1>
      <p className="mt-1 text-muted">A limit per category, checked against this month.</p>

      <section className="mt-5 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Set a budget</h2>
        <BudgetForm onSaved={() => setReloadKey((key) => key + 1)} />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Your budgets</h2>
        <p className="mt-0.5 text-sm text-muted">Spending counts expenses from this month only.</p>

        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-no">
            {deleteError}
          </p>
        )}

        {state.kind === 'loading' && <p className="mt-4 text-muted">Counting your money...</p>}

        {state.kind === 'error' && (
          <div role="alert" className="mt-4">
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

        {state.kind === 'ready' && state.items.length === 0 && (
          <p className="mt-4 text-muted">No budgets yet. Spending freely, are we?</p>
        )}

        {state.kind === 'ready' && state.items.length > 0 && (
          <ul className="mt-3 divide-y divide-dashed divide-line border-y border-dashed border-line">
            {state.items.map((item) => {
              const { percent, over, near } = usage(item)
              return (
                <li key={item.id} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium capitalize">{item.category}</p>
                    <p className="shrink-0 font-mono text-sm">
                      {formatMoney(item.spentThisMonth, currency)} of{' '}
                      {formatMoney(item.monthlyLimit, currency)}
                    </p>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-no' : near ? 'bg-risky' : 'bg-yes'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className={`text-sm ${over ? 'font-medium text-no' : 'text-muted'}`}>
                      {over ? 'Over the limit' : near ? 'Close to the limit' : `${percent}% used`}
                    </p>

                    {confirmingId === item.id ? (
                      <span className="flex items-center gap-3 text-sm">
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => void handleDelete(item.id)}
                          className="font-medium text-no underline underline-offset-4 disabled:opacity-60"
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="text-muted underline underline-offset-4"
                        >
                          Keep
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Delete ${item.category} budget`}
                        onClick={() => setConfirmingId(item.id)}
                        className="text-sm text-muted underline underline-offset-4 hover:text-no"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}