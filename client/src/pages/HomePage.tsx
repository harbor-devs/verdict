import { useAuth } from '../lib/authContext'

// Placeholder only. The real Home screen is built later.
export default function HomePage() {
  const { user, logout } = useAuth()

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="font-display text-3xl font-bold">Hi, {user?.displayName}.</h1>
      <p className="mt-1 text-muted">Placeholder Home screen. The real one comes later.</p>
      <button
        type="button"
        onClick={() => void logout()}
        className="mt-6 rounded-lg border border-line bg-card px-4 py-2 font-medium"
      >
        Log out
      </button>
    </main>
  )
}