import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Budget, BudgetsResponse } from '../api/types'
import BudgetForm from '../components/BudgetForm'
import { Card, PageHeader } from '../components/CaseFile'
import { ReceiptPaper, Stamp } from '../components/Receipt'
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
    <main className="mx-auto flex w-full max-w-6xl flex-col px-5 py-4 md:h-full md:px-14">
      <PageHeader
        label="The house rules"
        title="The limits."
        note="set the rules, then follow them"
      />

      <div className="grid gap-9 md:min-h-0 md:flex-1 md:grid-cols-[1fr_360px] md:grid-rows-[minmax(0,1fr)] md:gap-10 md:pb-3">
        <div>
          <Card tab="Set a limit" className="max-w-md">
            <BudgetForm onSaved={() => setReloadKey((key) => key + 1)} />
          </Card>
        </div>

        <ReceiptPaper title="Limits.">
          <p className="mb-1 text-center text-xs text-muted">
            Spending counts expenses from this month only.
          </p>

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
            <p className="mt-4 text-center text-muted">No budgets yet. Spending freely, are we?</p>
          )}

          {state.kind === 'ready' && state.items.length > 0 && (
            <ul className="divide-y-2 divide-dashed divide-line">
              {state.items.map((item) => {
                const { percent, over, near } = usage(item)
                return (
                  <li key={item.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-bold capitalize">{item.category}</p>
                      {over && (
                        <Stamp tone="no" size="sm">
                          Over
                        </Stamp>
                      )}
                    </div>
                    <p className="font-receipt text-xs">
                      {formatMoney(item.spentThisMonth, currency)} of{' '}
                      {formatMoney(item.monthlyLimit, currency)}
                    </p>

                    <div className="mt-1.5 h-[14px] border-2 border-edge bg-tab">
                      <div
                        className={`h-full ${over ? 'bg-no' : near ? 'bg-risky' : 'bg-yes'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                      <p className={over ? 'font-bold text-no' : 'text-muted'}>
                        {over ? 'Over the limit' : near ? 'Close to the limit' : `${percent}% used`}
                      </p>

                      {confirmingId === item.id ? (
                        <span className="flex items-center gap-3">
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
                          className="text-muted underline underline-offset-4 hover:text-no"
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
        </ReceiptPaper>
      </div>
    </main>
  )
}