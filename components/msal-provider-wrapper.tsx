'use client'

/**
 * MSAL Provider Wrapper
 *
 * Wraps the app with MsalProvider and AuthProvider
 */

import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from '@/lib/msalConfig'
import { AuthProvider } from '@/contexts/auth-context'
import { AppLayoutClient } from '@/components/app-layout-client'
import { useEffect, useState } from 'react'

let msalInstance: PublicClientApplication | null = null
let initializationPromise: Promise<void> | null = null

export function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [instance, setInstance] = useState<PublicClientApplication | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Initialize MSAL instance only once
        if (!msalInstance) {
          msalInstance = new PublicClientApplication(msalConfig)

          // CRITICAL: Initialize MSAL before using it
          await msalInstance.initialize()

          // Handle redirect promise after initialization
          await msalInstance.handleRedirectPromise()
        } else if (!initializationPromise) {
          // If instance exists but not initialized, wait for initialization
        }

        setInstance(msalInstance)
        setIsInitializing(false)
      } catch {
        setIsInitializing(false)
      }
    }

    // Store initialization promise to prevent race conditions
    if (!initializationPromise) {
      initializationPromise = initializeMsal()
    }
  }, [])

  if (!instance || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">A inicializar autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <MsalProvider instance={instance}>
      <AuthProvider>
        <AppLayoutClient>{children}</AppLayoutClient>
      </AuthProvider>
    </MsalProvider>
  )
}
