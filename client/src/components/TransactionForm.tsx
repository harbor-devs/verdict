import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import type { TransactionKind } from '../api/types'
import { inputClass, primaryButtonClass } from '../lib/formStyles'
import { CategoryChips, Field } from './FormBits'

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={`min-h-11 rounded-md border-2 border-edge font-receipt text-sm font-bold tracking-wider uppercase transition ${
              kind === option ? 'bg-highlight text-ink' : 'bg-transparent text-ink hover:bg-tab'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <Field id="amount" label="Amount" error={fieldErrors.amount}>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={fieldErrors.amount ? true : undefined}
            className={inputClass(Boolean(fieldErrors.amount))}
          />
        </Field>

           <Field id="category" label="Category" error={fieldErrors.category}>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-invalid={fieldErrors.category ? true : undefined}
            className={inputClass(Boolean(fieldErrors.category))}
          />
        </Field>

        <div className="col-span-2">
          <CategoryChips ideas={CATEGORY_IDEAS} value={category} onPick={setCategory} />
        </div>

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
      </div>

      {formError && !hasFieldErrors && (
        <p role="alert" className="text-sm text-no">
          {formError}
        </p>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? 'One sec...' : 'File it'}
      </button>
    </form>
  )
}