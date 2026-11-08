import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import { inputClass, primaryButtonClass } from '../lib/formStyles'
import { CategoryChips, Field } from './FormBits'

type Props = { onSaved: () => void }

// Only suggestions. The server accepts any category you type.
const CATEGORY_IDEAS = ['food', 'transport', 'bills', 'rent', 'shopping', 'fun', 'health', 'other']

export default function BudgetForm({ onSaved }: Props) {
  const [category, setCategory] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})

    try {
      // The limit is sent as typed. The server checks it and does the money math.
      await api('/api/budgets', {
        method: 'PUT',
        body: { category, monthlyLimit },
      })
      setCategory('')
      setMonthlyLimit('')
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
      <Field id="budget-category" label="Category" error={fieldErrors.category}>
        <input
          id="budget-category"
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-invalid={fieldErrors.category ? true : undefined}
          className={inputClass(Boolean(fieldErrors.category))}
        />
        <CategoryChips ideas={CATEGORY_IDEAS} value={category} onPick={setCategory} />a
      </Field>

      <Field id="budget-limit" label="Monthly limit" error={fieldErrors.monthlyLimit}>
        <input
          id="budget-limit"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={monthlyLimit}
          onChange={(event) => setMonthlyLimit(event.target.value)}
          aria-invalid={fieldErrors.monthlyLimit ? true : undefined}
          className={inputClass(Boolean(fieldErrors.monthlyLimit))}
        />
      </Field>

      <p className="text-sm text-muted">
        Already have a budget for that category? Saving again changes its limit.
      </p>

      {formError && !hasFieldErrors && (
        <p role="alert" className="text-sm text-no">
          {formError}
        </p>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? 'One sec...' : 'Set limit'}
      </button>
    </form>
  )
}