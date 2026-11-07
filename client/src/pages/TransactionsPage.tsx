import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../api/client'
import type { Transaction, TransactionsResponse } from '../api/types'
import TransactionForm from '../components/TransactionForm'
import { useAuth } from '../lib/authContext'
import { formatMoney } from '../lib/format'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: Transaction[] }

// Turns "2026-11-05" into "5 Nov"
function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
  })
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [state, setState] = useState<State>({ kind: 'loading' })
  // Changing this number makes the list load again (after adding or deleting one)
  const [reloadKey, setReloadKey] = useState(0)
  // The row that is showing "Yes, delete / Keep"
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // The row that is being deleted right now
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    // If the screen closes before the answer arrives, we ignore the answer
    let cancelled = false

    api<TransactionsResponse>('/api/transactions')
      .then((res) => {
        if (!cancelled) setState({ kind: 'ready', items: res.transactions })
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
      await api(`/api/transactions/${id}`, { method: 'DELETE' })
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
      <h1 className="mt-4 font-display text-3xl font-bold">Transactions</h1>
      <p className="mt-1 text-muted">Every rupee in and out, with receipts.</p>

      <section className="mt-5 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Add one</h2>
        <TransactionForm onAdded={() => setReloadKey((key) => key + 1)} />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Latest</h2>
        <p className="mt-0.5 text-sm text-muted">Newest 50, from all months.</p>

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
          <p className="mt-4 text-muted">Nothing logged yet. Your wallet is suspiciously quiet.</p>
        )}

        {state.kind === 'ready' && state.items.length > 0 && (
          <ul className="mt-3 divide-y divide-dashed divide-line border-y border-dashed border-line">
            {state.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium capitalize">{item.category}</p>
                  {item.note && <p className="truncate text-sm text-muted">{item.note}</p>}
                  <p className="text-sm text-muted">{formatDay(item.occurredOn)}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className={`font-mono ${item.kind === 'income' ? 'text-yes' : 'text-ink'}`}>
                    {item.kind === 'income' ? '+' : '-'}
                    {formatMoney(item.amount, currency)}
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
                      aria-label={`Delete ${item.category} transaction`}
                      onClick={() => setConfirmingId(item.id)}
                      className="text-sm text-muted underline underline-offset-4 hover:text-no"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}