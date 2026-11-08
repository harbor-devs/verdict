import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import type { Goal, GoalsResponse } from '../api/types'
import { Card, PageHeader } from '../components/CaseFile'
import GoalForm from '../components/GoalForm'
import { Stamp } from '../components/Receipt'
import { useAuth } from '../lib/authContext'
import { formatMoney } from '../lib/format'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: Goal[] }

type RowProps = { goal: Goal; number: number; currency: string; onChanged: () => void }

// One goal as a card. It owns its own "add money" box and its own delete confirm.
function GoalCard({ goal, number, currency, onChanged }: RowProps) {
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddBusy(true)
    setAddError('')

    try {
      // The amount is sent as typed. The server checks it and adds it.
      await api(`/api/goals/${goal.id}/add`, { method: 'POST', body: { amount } })
      setAmount('')
      setAdding(false)
      onChanged()
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = (error.fields ?? {}) as Record<string, string>
        setAddError(fields.amount ?? error.message)
      } else {
        setAddError('Something went wrong. Try again.')
      }
    } finally {
      setAddBusy(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')

    try {
      await api(`/api/goals/${goal.id}`, { method: 'DELETE' })
      setConfirming(false)
      onChanged()
    } catch (error) {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Could not delete that. Try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <li>
      <Card tab={`Plan ${String(number).padStart(2, '0')}`} className="h-full">
        {goal.reached && (
          <div className="absolute top-3 right-3">
            <Stamp tone="yes" size="sm">
              Paid in full
            </Stamp>
          </div>
        )}

        <p className="pr-28 text-xl font-bold">{goal.name}</p>
        {goal.targetDate && (
          <p className="font-receipt text-xs text-muted uppercase">By {goal.targetDate}</p>
        )}

        <p className="mt-3 font-receipt text-2xl font-bold">
          {formatMoney(goal.savedAmount, currency)}
        </p>
        <p className="text-sm text-muted">
          of {formatMoney(goal.targetAmount, currency)} ·{' '}
          {goal.reached
            ? 'goal reached'
            : `${goal.percent}% saved, ${formatMoney(goal.remaining, currency)} to go`}
        </p>

        <div className="mt-2.5 h-[18px] border-2 border-edge bg-tab">
          <div className="h-full bg-yes" style={{ width: `${goal.percent}%` }} />
        </div>

        {goal.reached && (
          <p className="mt-2 -rotate-2 font-hand text-2xl text-no">case closed.</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-4">
          {confirming ? (
            <span className="flex items-center gap-3 text-sm">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="font-bold text-no underline underline-offset-4 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-muted underline underline-offset-4"
              >
                Keep
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                aria-label={`Add money to ${goal.name}`}
                onClick={() => {
                  setAdding((open) => !open)
                  setAddError('')
                }}
                className="text-sm font-bold underline underline-offset-4"
              >
                {adding ? 'Cancel' : 'Add money'}
              </button>
              <button
                type="button"
                aria-label={`Delete ${goal.name} goal`}
                onClick={() => setConfirming(true)}
                className="text-sm text-muted underline underline-offset-4 hover:text-no"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {adding && (
          <form onSubmit={handleAdd} noValidate className="mt-3">
            <label
              htmlFor={`add-${goal.id}`}
              className="block font-receipt text-xs tracking-widest text-muted uppercase"
            >
              Amount to add
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id={`add-${goal.id}`}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={addError ? true : undefined}
                className={`min-h-11 w-full min-w-0 rounded-md border-2 bg-transparent px-3 font-receipt outline-none focus:bg-highlight/30 ${
                  addError ? 'border-no' : 'border-edge'
                }`}
              />
              <button
                type="submit"
                disabled={addBusy}
                className="shrink-0 rounded-md bg-ink px-4 font-receipt text-sm font-bold tracking-wider text-paper uppercase disabled:opacity-60"
              >
                {addBusy ? 'Adding...' : 'Add'}
              </button>
            </div>
            {addError && (
              <p role="alert" className="mt-1 text-sm text-no">
                {addError}
              </p>
            )}
          </form>
        )}

        {deleteError && (
          <p role="alert" className="mt-2 text-sm text-no">
            {deleteError}
          </p>
        )}
      </Card>
    </li>
  )
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [state, setState] = useState<State>({ kind: 'loading' })
  // Changing this number makes the list load again (after adding, adding money or deleting)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // If the screen closes before the answer arrives, we ignore the answer
    let cancelled = false

    api<GoalsResponse>('/api/goals')
      .then((res) => {
        if (!cancelled) setState({ kind: 'ready', items: res.goals })
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
  const reload = () => setReloadKey((key) => key + 1)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-5 py-5 md:h-full md:px-14">
      <PageHeader label="The long game" title="The savings plans." note="future you is watching" />

      <div className="grid gap-9 md:min-h-0 md:flex-1 md:grid-cols-[330px_1fr] md:grid-rows-[minmax(0,1fr)] md:gap-10 md:pb-3">
        <div className="md:self-start">
          <Card tab="Open a new plan">
            <GoalForm onSaved={reload} />
          </Card>
          <p className="mt-4 text-sm text-muted">
            Adding money here only moves the goal counter. Your balance stays the same.
          </p>
        </div>

        <div className="md:min-h-0 md:overflow-y-auto">
          {state.kind === 'loading' && <p className="text-muted">Counting your money...</p>}

          {state.kind === 'error' && (
            <div role="alert">
              <p className="text-no">{state.message}</p>
              <button
                type="button"
                onClick={() => {
                  setState({ kind: 'loading' })
                  reload()
                }}
                className="mt-3 rounded-md bg-ink px-4 py-2 font-bold text-paper"
              >
                Try again
              </button>
            </div>
          )}

          {state.kind === 'ready' && state.items.length === 0 && (
            <p className="text-muted">No goals yet. Dreams are free, saving is the hard part.</p>
          )}

          {state.kind === 'ready' && state.items.length > 0 && (
            <ul className="grid content-start gap-x-8 gap-y-9 p-2 pt-5 sm:grid-cols-2 xl:grid-cols-3">
              {state.items.map((item, index) => (
                <GoalCard
                  key={item.id}
                  goal={item}
                  number={index + 1}
                  currency={currency}
                  onChanged={reload}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}