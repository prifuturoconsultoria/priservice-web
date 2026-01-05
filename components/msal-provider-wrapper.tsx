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

export function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [instance, setInstance] = useState<PublicClientApplication | null>(null)

  useEffect(() => {
    // Initialize MSAL instance only once
    if (!msalInstance) {
      msalInstance = new PublicClientApplication(msalConfig)

      // Handle redirect promise
      msalInstance.handleRedirectPromise().then((response) => {
        if (response) {
          console.log('[MSAL] Redirect successful:', response.account?.username)
        }
      }).catch((error) => {
        console.error('[MSAL] Redirect error:', error)
      })
    }

    setInstance(msalInstance)
  }, [])

  if (!instance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
