import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Transaction, TransactionsResponse } from '../api/types'
import { Card, PageHeader } from '../components/CaseFile'
import { ReceiptPaper } from '../components/Receipt'
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
    <main className="mx-auto flex w-full max-w-6xl flex-col px-5 py-4 md:h-full md:px-14">
      <PageHeader label="The evidence" title="Every exhibit on file." note="receipts do not lie" />

      <div className="grid gap-9 md:min-h-0 md:flex-1 md:grid-cols-[1fr_360px] md:grid-rows-[minmax(0,1fr)] md:gap-10 md:pb-3">
        <div>
          <Card tab="File a new exhibit" className="max-w-lg">
            <TransactionForm onAdded={() => setReloadKey((key) => key + 1)} />
          </Card>
        </div>

        <ReceiptPaper title="Evidence.">
          <p className="mb-1 text-center text-xs text-muted">Newest 50, from all months.</p>

          {deleteError && (
            <p role="alert" className="my-2 text-center text-sm text-no">
              {deleteError}
            </p>
          )}

          {state.kind === 'loading' && (
            <p className="mt-4 text-center text-muted">Counting your money...</p>
          )}

          {state.kind === 'error' && (
            <div role="alert" className="mt-4 text-center">
              <p className="text-no">{state.message}</p>
              <button
                type="button"
                onClick={() => {
                  setState({ kind: 'loading' })
                  setReloadKey((key) => key + 1)
                }}
                className="mt-3 rounded-md bg-ink px-4 py-2 font-bold text-paper"
              >
                Try again
              </button>
            </div>
          )}

          {state.kind === 'ready' && state.items.length === 0 && (
            <p className="mt-4 text-center text-muted">
              Nothing logged yet. Your wallet is suspiciously quiet.
            </p>
          )}

          {state.kind === 'ready' && state.items.length > 0 && (
            <ul className="divide-y-2 divide-dashed divide-line">
              {state.items.map((item, index) => (
                <li key={item.id} className="py-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 truncate font-medium capitalize">{item.category}</span>
                    <span
                      aria-hidden="true"
                      className="min-w-3 flex-1 border-b-2 border-dotted border-line"
                    />
                    <span
                      className={`shrink-0 font-receipt text-sm font-bold ${
                        item.kind === 'income' ? 'text-yes' : 'text-ink'
                      }`}
                    >
                      {item.kind === 'income' ? '+' : '-'}
                      {formatMoney(item.amount, currency)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-muted">
                    <span className="min-w-0 truncate font-receipt uppercase">
                      EXH. {state.items.length - index} · {formatDay(item.occurredOn)}
                      {item.note ? ` · ${item.note}` : ''}
                    </span>

                    {confirmingId === item.id ? (
                      <span className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => void handleDelete(item.id)}
                          className="font-bold text-no underline underline-offset-4 disabled:opacity-60"
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="underline underline-offset-4"
                        >
                          Keep
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Delete ${item.category} transaction`}
                        onClick={() => setConfirmingId(item.id)}
                        className="shrink-0 underline underline-offset-4 hover:text-no"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ReceiptPaper>
      </div>
    </main>
  )
}