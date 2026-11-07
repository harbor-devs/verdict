import { useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'

type Props = { onSaved: () => void }

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

export default function GoalForm({ onSaved }: Props) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
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
      // The date is only sent when you filled it in.
      await api('/api/goals', {
        method: 'POST',
        body: { name, targetAmount, ...(targetDate ? { targetDate } : {}) },
      })
      setName('')
      setTargetAmount('')
      setTargetDate('')
      onSaved()
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
      <Field id="goal-name" label="What are you saving for?" error={fieldErrors.name}>
        <input
          id="goal-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={fieldErrors.name ? true : undefined}
          className={inputClass(Boolean(fieldErrors.name))}
        />
      </Field>

      <Field id="goal-target" label="Target amount" error={fieldErrors.targetAmount}>
        <input
          id="goal-target"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
          aria-invalid={fieldErrors.targetAmount ? true : undefined}
          className={`${inputClass(Boolean(fieldErrors.targetAmount))} font-mono`}
        />
      </Field>

      <Field id="goal-date" label="Target date (optional)" error={fieldErrors.targetDate}>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          aria-invalid={fieldErrors.targetDate ? true : undefined}
          className={inputClass(Boolean(fieldErrors.targetDate))}
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
        {submitting ? 'One sec...' : 'Add goal'}
      </button>
    </form>
  )
}