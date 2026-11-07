import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../api/client'
import type { Goal, GoalsResponse } from '../api/types'
import GoalForm from '../components/GoalForm'
import { useAuth } from '../lib/authContext'
import { formatMoney } from '../lib/format'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: Goal[] }

type RowProps = { goal: Goal; currency: string; onChanged: () => void }

// One goal on the list. It owns its own "add money" box and its own delete confirm.
function GoalRow({ goal, currency, onChanged }: RowProps) {
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
    <li className="py-3">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium">{goal.name}</p>
        <p className="shrink-0 font-mono text-sm">
          {formatMoney(goal.savedAmount, currency)} of {formatMoney(goal.targetAmount, currency)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-yes" style={{ width: `${goal.percent}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <p className={`text-sm ${goal.reached ? 'font-medium text-yes' : 'text-muted'}`}>
          {goal.reached
            ? 'Goal reached'
            : `${goal.percent}% saved, ${formatMoney(goal.remaining, currency)} to go`}
        </p>

        {confirming ? (
          <span className="flex items-center gap-3 text-sm">
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="font-medium text-no underline underline-offset-4 disabled:opacity-60"
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
          <span className="flex items-center gap-3 text-sm">
            <button
              type="button"
              aria-label={`Add money to ${goal.name}`}
              onClick={() => {
                setAdding((open) => !open)
                setAddError('')
              }}
              className="font-medium underline underline-offset-4"
            >
              {adding ? 'Cancel' : 'Add money'}
            </button>
            <button
              type="button"
              aria-label={`Delete ${goal.name} goal`}
              onClick={() => setConfirming(true)}
              className="text-muted underline underline-offset-4 hover:text-no"
            >
              Delete
            </button>
          </span>
        )}
      </div>

      {goal.targetDate && (
        <p className="mt-1 text-sm text-muted">Target date: {goal.targetDate}</p>
      )}

      {adding && (
        <form onSubmit={handleAdd} noValidate className="mt-3">
          <label htmlFor={`add-${goal.id}`} className="block text-sm font-medium">
            Amount to add
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={`add-${goal.id}`}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={addError ? true : undefined}
              className={`w-full rounded-lg border bg-card px-3.5 py-2.5 font-mono text-base outline-none transition focus:ring-2 focus:ring-yes/30 ${
                addError ? 'border-no' : 'border-line focus:border-yes'
              }`}
            />
            <button
              type="submit"
              disabled={addBusy}
              className="shrink-0 rounded-lg bg-ink px-4 py-2.5 font-medium text-paper transition hover:bg-ink/90 disabled:opacity-60"
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
    <main className="mx-auto max-w-md px-5 py-6">
      <Link to="/" className="text-sm font-medium underline underline-offset-4">
        Back to Home
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">Goals</h1>
      <p className="mt-1 text-muted">
        Things you are saving for. Adding money here only moves the goal counter, your balance
        stays the same.
      </p>

      <section className="mt-5 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Add a goal</h2>
        <GoalForm onSaved={reload} />
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Your goals</h2>

        {state.kind === 'loading' && <p className="mt-4 text-muted">Counting your money...</p>}

        {state.kind === 'error' && (
          <div role="alert" className="mt-4">
            <p className="text-no">{state.message}</p>
            <button
              type="button"
              onClick={() => {
                setState({ kind: 'loading' })
                reload()
              }}
              className="mt-3 rounded-lg bg-ink px-4 py-2 font-medium text-paper"
            >
              Try again
            </button>
          </div>
        )}

        {state.kind === 'ready' && state.items.length === 0 && (
          <p className="mt-4 text-muted">No goals yet. Dreams are free, saving is the hard part.</p>
        )}

        {state.kind === 'ready' && state.items.length > 0 && (
          <ul className="mt-3 divide-y divide-dashed divide-line border-y border-dashed border-line">
            {state.items.map((item) => (
              <GoalRow key={item.id} goal={item} currency={currency} onChanged={reload} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}