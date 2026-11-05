import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import { AuthContext, type AuthState, type User } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // True until we know whether the visitor is logged in
  const [loading, setLoading] = useState(true)

  // On app start, ask the backend "who am I?" using the login cookie
  useEffect(() => {
    let cancelled = false

    api<{ user: User }>('/api/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch((error) => {
        // A 401 only means "not logged in", which is normal
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error(error)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setUser(data.user)
  }, [])

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const data = await api<{ user: User }>('/api/auth/signup', {
        method: 'POST',
        body: { email, password, displayName },
      })
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    await api<void>('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
