import { useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { VerdictLevel, VerdictReason, VerdictResponse } from '../api/types'
import { Card, PageHeader } from '../components/CaseFile'
import { CategoryChips, Field } from '../components/FormBits'
import { Stamp } from '../components/Receipt'
import { currentCase } from '../lib/caseNumber'
import { useAuth } from '../lib/authContext'
import { formatMoney } from '../lib/format'
import { inputClass, primaryButtonClass } from '../lib/formStyles'

// Only suggestions. The server accepts any category you type.
const CATEGORY_IDEAS = ['food', 'transport', 'bills', 'rent', 'shopping', 'fun', 'health', 'other']

const TONE: Record<VerdictLevel, 'yes' | 'risky' | 'no'> = {
  YES: 'yes',
  RISKY: 'risky',
  NO: 'no',
}

// Handwritten line under the verdict. Only lives on this screen.
const SCRIBBLE: Record<VerdictLevel, string> = {
  YES: 'go on then.',
  RISKY: 'think twice.',
  NO: 'put it down.',
}

const REASON_TEXT: Record<VerdictReason, string> = {
  OK: 'You can pay for it and still keep a healthy cushion.',
  TOO_EXPENSIVE: 'Your balance does not cover it.',
  OVER_BUDGET: 'It would push this category over its budget for the month.',
  THIN_BUFFER: 'You can pay for it, but it leaves a thin cushion for the month.',
}

function Divider() {
  return <div className="my-2 border-t-2 border-dashed border-line" />
}

// A tight receipt row: label, dotted line, amount
function Row({
  label,
  value,
  valueClassName = '',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="ledger-row py-1! text-sm">
      <dt>{label}</dt>
      <dd className={`font-receipt font-bold ${valueClassName}`}>{value}</dd>
    </div>
  )
}

function ReceiptHead({ children }: { children?: ReactNode }) {
  return (
    <>
      <p className="text-center font-receipt text-base font-bold tracking-widest uppercase">
        Verdict.
      </p>
      <p className="text-center font-receipt text-xs text-muted uppercase">{children}</p>
    </>
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
  const today = new Date().toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const headLine = `No. ${currentCase()} · ${today}`

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
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-4 md:h-full md:grid-cols-[1fr_320px] md:items-start md:px-14">
      <div>
        <PageHeader label="Pre-trial" title="Can I afford this?" note="ask before you swipe" />

        <div className="max-w-md">
          <Card tab="The purchase">
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
                  className={inputClass(Boolean(fieldErrors.amount))}
                />
              </Field>

              <Field id="afford-category" label="Category (optional)" error={fieldErrors.category}>
                     <input
                  id="afford-category"
                  type="text"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value)
                    setResult(null)
                  }}
                  aria-invalid={fieldErrors.category ? true : undefined}
                  className={inputClass(Boolean(fieldErrors.category))}
                />
                <CategoryChips
                  ideas={CATEGORY_IDEAS}
                  value={category}
                  onPick={(idea) => {
                    setCategory(idea)
                    setResult(null)
                  }}
                />
              </Field>

              <p className="text-sm text-muted">
                Add a category to also check it against your budget for that category.
              </p>

              {formError && !hasFieldErrors && (
                <p role="alert" className="text-sm text-no">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting ? 'Thinking...' : 'Check it'}
              </button>
            </form>
          </Card>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {(['yes', 'risky', 'no'] as const).map((tone) => (
              <div
                key={tone}
                className="flex justify-center rounded-md border-2 border-edge bg-card py-2"
              >
                <Stamp tone={tone} size="sm">
                  {tone}
                </Stamp>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The receipt: narrow and tall, like a real till slip */}
      <div className="receipt-shadow h-fit w-full">
        {result ? (
          <section
            role="status"
            key={`${result.amount}-${result.verdict}`}
            className="receipt receipt-print px-5 py-7 text-ink"
          >
            <ReceiptHead>{headLine}</ReceiptHead>

            <Divider />

            <div className="flex justify-center">
              <Stamp tone={TONE[result.verdict]}>{result.verdict}</Stamp>
            </div>
            <h2 className="mt-1 text-center font-display text-xl leading-[1.1] font-extrabold tracking-tight">
              {result.message}
            </h2>
            <p className="mt-1.5 text-center text-xs text-muted">{REASON_TEXT[result.reason]}</p>

            <Divider />

            <dl>
              <Row label="Price" value={formatMoney(result.amount, currency)} />
              <Row label="Balance now" value={formatMoney(result.balance, currency)} />
              <Row
                label="After buying"
                value={formatMoney(result.remainingBalance, currency)}
                valueClassName={result.remainingBalance.startsWith('-') ? 'text-no' : ''}
              />
              {result.budget && (
                <>
                  <Row
                    label="Budget used"
                    value={formatMoney(result.budget.spentThisMonth, currency)}
                  />
                  <Row label="Budget limit" value={formatMoney(result.budget.limit, currency)} />
                </>
              )}
            </dl>

            <Divider />

            <p className="-rotate-2 text-center font-hand text-2xl text-no">
              {SCRIBBLE[result.verdict]}
            </p>
            <div className="receipt-barcode mx-auto mt-2 h-6 w-4/5" aria-hidden="true" />
            <p className="mt-1.5 text-center font-receipt text-xs tracking-widest text-muted uppercase">
              Nothing was saved
            </p>
          </section>
        ) : (
          <section className="receipt px-5 py-7 text-ink">
            <ReceiptHead>{headLine}</ReceiptHead>
            <Divider />
            <h2 className="text-center font-display text-xl leading-[1.1] font-extrabold tracking-tight">
              Type a price. The court will rule.
            </h2>
            <p className="mt-1.5 text-center text-xs text-muted">
              Nothing is saved, it is only a check.
            </p>
            <div className="receipt-barcode mx-auto mt-4 h-6 w-4/5" aria-hidden="true" />
          </section>
        )}
      </div>
    </main>
  )
}