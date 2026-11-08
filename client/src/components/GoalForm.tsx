import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import { inputClass, primaryButtonClass } from '../lib/formStyles'
import { Field } from './FormBits'

type Props = { onSaved: () => void }

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
          className={inputClass(Boolean(fieldErrors.targetAmount))}
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

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? 'One sec...' : 'Open the file'}
      </button>
    </form>
  )
}