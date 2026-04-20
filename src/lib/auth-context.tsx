'use client'

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react'
import type { User, Session } from './auth-custom'

interface AuthContextType {
  session: Session | null
  loading: boolean
  signIn: (provider: 'github' | 'steam') => void
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    })
    
    if (!response.ok) {
      setSession(null)
      setLoading(false)
      return
    }
    
    const data = await response.json()
    setSession(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const signIn = useCallback((provider: 'github' | 'steam') => {
    if (provider === 'github') {
      window.location.href = '/api/auth/signin/github'
    } else if (provider === 'steam') {
      window.location.href = '/api/auth/signin/steam'
    }
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { 
      method: 'POST',
      credentials: 'include',
    })
    setSession(null)
    window.location.href = '/'
  }, [])

  const refreshSession = useCallback(async () => {
    setLoading(true)
    await fetchSession()
  }, [fetchSession])

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
