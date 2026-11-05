import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../lib/authContext'

type Props = { mode: 'login' | 'signup' }

type FieldProps = {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  error?: string
  hint?: string
}

function Field({ id, label, type, value, onChange, autoComplete, error, hint }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        className={`mt-1.5 w-full rounded-lg border bg-card px-3.5 py-2.5 text-base outline-none transition focus:ring-2 focus:ring-yes/30 ${
          error ? 'border-no' : 'border-line focus:border-yes'
        }`}
      />
      {error ? (
        <p className="mt-1 text-sm text-no">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export default function AuthPage({ mode }: Props) {
  const { login, signup } = useAuth()
  const isSignup = mode === 'signup'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})

    try {
      if (isSignup) {
        await signup(email, password, displayName)
      } else {
        await login(email, password)
      }
      // On success the app moves to Home by itself
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
        if (error.fields && typeof error.fields === 'object') {
          setFieldErrors(error.fields as Record<string, string>)
        }
      } else {
        setFormError('Something went wrong. Try again.')
      }
      setSubmitting(false)
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Verdict<span className="text-yes">.</span>
      </h1>
      <p className="mt-1 text-muted">Money with receipts.</p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 rounded-2xl border border-line bg-card p-5"
      >
        <h2 className="font-display text-2xl font-bold">
          {isSignup ? 'Start your ledger.' : 'Welcome back.'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isSignup
            ? 'Private by default. Your data stays yours.'
            : 'Log in to see what you did to your wallet.'}
        </p>

        <div className="mt-5 space-y-4">
          {isSignup && (
            <Field
              id="displayName"
              label="What should we call you?"
              type="text"
              value={displayName}
              onChange={setDisplayName}
              autoComplete="name"
              error={fieldErrors.displayName}
            />
          )}
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            error={fieldErrors.email}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            error={fieldErrors.password}
            hint={isSignup ? 'At least 10 characters.' : undefined}
          />
        </div>

        {formError && !hasFieldErrors && (
          <p role="alert" className="mt-4 text-sm text-no">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-ink px-4 py-3 font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          {submitting ? 'One sec...' : isSignup ? 'Create my ledger' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isSignup ? 'Already have a ledger? ' : 'New here? '}
        <Link
          to={isSignup ? '/login' : '/signup'}
          className="font-medium text-ink underline underline-offset-4"
        >
          {isSignup ? 'Log in' : 'Create one'}
        </Link>
      </p>
    </main>
  )
}