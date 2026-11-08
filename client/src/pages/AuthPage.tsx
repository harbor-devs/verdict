import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { Card } from '../components/CaseFile'
import { Field } from '../components/FormBits'
import { useAuth } from '../lib/authContext'
import { inputClass, primaryButtonClass } from '../lib/formStyles'

type Props = { mode: 'login' | 'signup' }

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
      <h1 className="font-display text-5xl font-extrabold tracking-tight">
        Verdict<span className="text-no">.</span>
      </h1>
      <p className="mt-1 -rotate-2 font-hand text-2xl text-no">money with receipts.</p>

      <div className="mt-10">
        <Card tab={isSignup ? 'Open a new case' : 'Back to court'}>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {isSignup ? 'Start your ledger.' : 'Welcome back.'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {isSignup
              ? 'Private by default. Your data stays yours.'
              : 'Log in to see what you did to your wallet.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            {isSignup && (
              <Field id="displayName" label="What should we call you?" error={fieldErrors.displayName}>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  aria-invalid={fieldErrors.displayName ? true : undefined}
                  className={inputClass(Boolean(fieldErrors.displayName))}
                />
              </Field>
            )}

            <Field id="email" label="Email" error={fieldErrors.email}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={fieldErrors.email ? true : undefined}
                className={inputClass(Boolean(fieldErrors.email))}
              />
            </Field>

            <Field id="password" label="Password" error={fieldErrors.password}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                aria-invalid={fieldErrors.password ? true : undefined}
                className={inputClass(Boolean(fieldErrors.password))}
              />
              {isSignup && !fieldErrors.password && (
                <p className="mt-1 text-sm text-muted">At least 10 characters.</p>
              )}
            </Field>

            {formError && !hasFieldErrors && (
              <p role="alert" className="text-sm text-no">
                {formError}
              </p>
            )}

            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? 'One sec...' : isSignup ? 'Create my ledger' : 'Log in'}
            </button>
          </form>
        </Card>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? 'Already have a ledger? ' : 'New here? '}
        <Link
          to={isSignup ? '/login' : '/signup'}
          className="font-bold text-ink underline underline-offset-4"
        >
          {isSignup ? 'Log in' : 'Create one'}
        </Link>
      </p>
    </main>
  )
}