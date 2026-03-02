'use client'

/**
 * Authentication Context Provider
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export type UserRole = 'admin' | 'technician' | 'observer'

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (authorizationCode: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_KEY = 'auth_user'
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize from sessionStorage (no background API call — JWT is the source of truth)
  useEffect(() => {
    const storedUser = sessionStorage.getItem(USER_KEY)
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed.role) {
          parsed.role = parsed.role.toLowerCase()
        }
        sessionStorage.setItem(USER_KEY, JSON.stringify(parsed))
        setUser(parsed)
      } catch {
        // Corrupted data — ignore
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (authorizationCode: string) => {
    try {
      setIsLoading(true)

      const response = await fetch(`${BACKEND_URL}/api/auth/azure-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode }),
      })

      if (!response.ok) {
        throw new Error('Backend authentication failed')
      }

      const data = await response.json()

      const normalizedUser: User = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName || data.user.full_name || '',
        role: (data.user.role || 'technician').toLowerCase() as UserRole,
      }

      sessionStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
      setUser(normalizedUser)

      const syncResponse = await fetch('/api/sync-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      })

      if (!syncResponse.ok) {
        throw new Error('Failed to sync authentication tokens')
      }

      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    sessionStorage.removeItem(USER_KEY)
    setUser(null)

    try {
      await fetch('/api/sync-tokens', { method: 'DELETE' })
    } catch {
      // Non-critical
    }

    window.location.href = '/login'
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (response.ok) {
        const profileData = await response.json()
        const updatedUser: User = {
          id: profileData.id,
          email: profileData.email,
          fullName: profileData.fullName || profileData.full_name,
          role: (profileData.role || 'technician').toLowerCase() as UserRole,
        }
        sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
    } catch {
      const storedUser = sessionStorage.getItem(USER_KEY)
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)) } catch {}
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
