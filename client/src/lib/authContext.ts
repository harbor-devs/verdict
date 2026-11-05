import { createContext, useContext } from 'react'

export type User = {
  id: string
  email: string
  displayName: string
  currency: string
}

export type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

// Any screen can call useAuth() to get the current user and the login functions
export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}