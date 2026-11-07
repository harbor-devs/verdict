import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../api/client'
import type { VerdictLevel, VerdictReason, VerdictResponse } from '../api/types'
import { useAuth } from '../lib/authContext'
import { formatMoney } from '../lib/format'

// Only suggestions. The server accepts any category you type.
const CATEGORY_IDEAS = ['food', 'transport', 'bills', 'rent', 'shopping', 'fun', 'health', 'other']

// Full class names written out so Tailwind can see them.
const STAMP_STYLE: Record<VerdictLevel, string> = {
  YES: 'border-yes text-yes',
  RISKY: 'border-risky text-risky',
  NO: 'border-no text-no',
}

const REASON_TEXT: Record<VerdictReason, string> = {
  OK: 'You can pay for it and still keep a healthy cushion.',
  TOO_EXPENSIVE: 'Your balance does not cover it.',
  OVER_BUDGET: 'It would push this category over its budget for the month.',
  THIN_BUFFER: 'You can pay for it, but it leaves a thin cushion for the month.',
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

type RowProps = { label: string; value: string }

function ReceiptRow({ label, value }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="shrink-0 font-mono text-sm">{value}</dd>
    </div>
  )
}

export default function AffordPage() {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<VerdictResponse | null>(null)

  const currency = user?.currency ?? 'PKR'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})
    setResult(null)

    try {
      // The price is sent as typed. The server checks it and decides the verdict.
      const trimmed = category.trim()
      const res = await api<VerdictResponse>('/api/verdict', {
        method: 'POST',
        body: { amount, ...(trimmed ? { category: trimmed } : {}) },
      })
      setResult(res)
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
    <main className="mx-auto max-w-md px-5 py-6">
      <Link to="/" className="text-sm font-medium underline underline-offset-4">
        Back to Home
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">Can I afford this?</h1>
      <p className="mt-1 text-muted">Type the price and get a straight answer. Nothing is saved.</p>

      <section className="mt-5 rounded-2xl border border-line bg-card p-5">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="afford-amount" label="How much is it?" error={fieldErrors.amount}>
            <input
              id="afford-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setResult(null)
              }}
              aria-invalid={fieldErrors.amount ? true : undefined}
              className={`${inputClass(Boolean(fieldErrors.amount))} font-mono`}
            />
          </Field>

          <Field id="afford-category" label="Category (optional)" error={fieldErrors.category}>
            <input
              id="afford-category"
              type="text"
              list="afford-category-ideas"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setResult(null)
              }}
              aria-invalid={fieldErrors.category ? true : undefined}
              className={inputClass(Boolean(fieldErrors.category))}
            />
            <datalist id="afford-category-ideas">
              {CATEGORY_IDEAS.map((idea) => (
                <option key={idea} value={idea} />
              ))}
            </datalist>
          </Field>

          <p className="text-sm text-muted">
            Add a category to also check it against your budget for that category.
          </p>

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
            {submitting ? 'Thinking...' : 'Give me the verdict'}
          </button>
        </form>
      </section>

      {result && (
        <section
          role="status"
          className="mt-4 rounded-2xl border border-line bg-card p-5 text-center"
        >
          <div className="py-3">
            <div
              className={`inline-block -rotate-6 rounded-lg border-4 px-5 py-1 font-display text-4xl font-bold uppercase tracking-widest ${STAMP_STYLE[result.verdict]}`}
            >
              {result.verdict}
            </div>
          </div>

          <p className="mt-2 text-lg font-medium">{result.message}</p>
          <p className="mt-1 text-sm text-muted">{REASON_TEXT[result.reason]}</p>

          <dl className="mt-4 divide-y divide-dashed divide-line border-y border-dashed border-line text-left">
            <ReceiptRow label="Price" value={formatMoney(result.amount, currency)} />
            <ReceiptRow label="Balance now" value={formatMoney(result.balance, currency)} />
            <ReceiptRow
              label="Balance after buying"
              value={formatMoney(result.remainingBalance, currency)}
            />
            {result.budget && (
              <ReceiptRow
                label="Spent so far in that budget"
                value={`${formatMoney(result.budget.spentThisMonth, currency)} of ${formatMoney(result.budget.limit, currency)}`}
              />
            )}
          </dl>
        </section>
      )}
    </main>
  )
}