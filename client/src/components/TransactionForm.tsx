import { useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { TransactionKind } from '../api/types'

type Props = { onAdded: () => void }

// Only suggestions. The server accepts any category you type.
const CATEGORY_IDEAS = [
  'food',
  'transport',
  'bills',
  'rent',
  'shopping',
  'fun',
  'health',
  'salary',
  'other',
]

// Today's date in your own time zone, as YYYY-MM-DD
function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function inputClass(hasError: boolean): string {
  return `mt-1.5 w-full rounded-lg border bg-card px-3.5 py-2.5 text-base outline-none transition focus:ring-2 focus:ring-yes/30 ${
    hasError ? 'border-no' : 'border-line focus:border-yes'
  }`
}

type FieldProps = { id: string; label: string; error?: string; children: ReactNode }

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-no">{error}</p>}
    </div>
  )
}

export default function TransactionForm({ onAdded }: Props) {
  const [kind, setKind] = useState<TransactionKind>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [occurredOn, setOccurredOn] = useState(todayLocal)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})

    try {
      // The amount is sent as typed. The server checks it and does the money math.
      await api('/api/transactions', {
        method: 'POST',
        body: {
          kind,
          amount,
          category,
          note: note.trim() || undefined,
          occurredOn: occurredOn || undefined,
        },
      })
      setAmount('')
      setCategory('')
      setNote('')
      onAdded()
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
        if (error.fields && typeof error.fields === 'object') {
          setFieldErrors(error.fields as Record<string, string>)
        }
      } else {
        setFormError('Something went wrong. Try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={`rounded-lg border px-3 py-2 font-medium capitalize transition ${
              kind === option
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-card text-ink hover:border-ink/40'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <Field id="amount" label="Amount" error={fieldErrors.amount}>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={fieldErrors.amount ? true : undefined}
          className={`${inputClass(Boolean(fieldErrors.amount))} font-mono`}
        />
      </Field>

      <Field id="category" label="Category" error={fieldErrors.category}>
        <input
          id="category"
          type="text"
          list="category-ideas"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-invalid={fieldErrors.category ? true : undefined}
          className={inputClass(Boolean(fieldErrors.category))}
        />
        <datalist id="category-ideas">
          {CATEGORY_IDEAS.map((idea) => (
            <option key={idea} value={idea} />
          ))}
        </datalist>
      </Field>

      <Field id="note" label="Note (optional)" error={fieldErrors.note}>
        <input
          id="note"
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={inputClass(Boolean(fieldErrors.note))}
        />
      </Field>

      <Field id="occurredOn" label="Date" error={fieldErrors.occurredOn}>
        <input
          id="occurredOn"
          type="date"
          value={occurredOn}
          onChange={(event) => setOccurredOn(event.target.value)}
          className={inputClass(Boolean(fieldErrors.occurredOn))}
        />
      </Field>

      {formError && !hasFieldErrors && (
        <p role="alert" className="text-sm text-no">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-ink px-4 py-3 font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
      >
        {submitting ? 'One sec...' : 'Add to ledger'}
      </button>
    </form>
  )
}