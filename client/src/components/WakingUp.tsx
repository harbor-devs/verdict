import { useEffect, useState } from 'react'

// Shown while the app checks who is logged in. On the free server the very
// first request can take up to a minute, so after a few seconds we explain why.
export default function WakingUp() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 text-center">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">
        Verdict<span className="text-no">.</span>
      </h1>
      <p className="mt-6 text-muted">Loading...</p>

      {slow && (
        <div role="status" aria-live="polite" className="mt-6">
          <p className="font-hand text-2xl text-no">the judge is still waking up.</p>
          <p className="mt-2 text-sm text-muted">
            Verdict runs on a free server that naps when nobody is around. The first visit can
            take up to a minute while it wakes up, and after that it is quick. Thanks for waiting.
          </p>
        </div>
      )}
    </main>
  )
}