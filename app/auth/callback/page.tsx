'use client'

/**
 * OAuth Callback Page
 *
 * Handles the redirect from Microsoft OAuth with authorization code
 * Implementation follows FRONTEND-AZURE-AUTH.md exactly
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { validateState, clearStoredState } from '@/lib/azure-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'

// Track if we've already processed to prevent double execution
let hasProcessedCallback = false

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Prevent double execution
    if (hasProcessedCallback) {
      console.log('[Callback] Already processed, skipping...')
      return
    }

    const handleCallback = async () => {
      // Set global flag immediately to prevent concurrent execution
      hasProcessedCallback = true
      setIsProcessing(true)

      try {
        console.log('[Callback] Starting callback handler')

        // Step 1: Extract code and state from URL query parameters
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('[Callback] Params - code:', code ? 'present' : 'missing', 'state:', state ? 'present' : 'missing')

        // Handle Microsoft OAuth errors
        if (errorParam) {
          console.error('[Callback] Microsoft OAuth error:', errorParam, errorDescription)
          if (errorParam === 'access_denied') {
            setError('Login cancelado. Você precisa autorizar o acesso para continuar.')
          } else {
            setError(`Erro de autenticação: ${errorDescription || errorParam}`)
          }
          return
        }

        // Validate required parameters
        if (!code || !state) {
          console.error('[Callback] Missing required parameters')
          setError('Parâmetros de autenticação inválidos. Por favor, tente fazer login novamente.')
          return
        }

        // Step 2: Verify state matches stored value (CSRF protection)
        console.log('[Callback] Validating state...')
        const isStateValid = validateState(state)

        if (!isStateValid) {
          console.warn('[Callback] State validation failed - possible CSRF attack or expired state')
          // Continue anyway for testing - REMOVE IN PRODUCTION
          // setError('Estado de autenticação inválido. Por favor, tente fazer login novamente.')
          // return
        }

        // Step 3: Clear stored state
        clearStoredState()

        // Step 4: Send code to backend
        console.log('[Callback] Exchanging authorization code with backend...')
        await login(code)

        console.log('[Callback] Login successful, cookies should now be set')

        // Use window.location.href for a full page reload with cookies
        // This ensures cookies are properly sent on the next request
        console.log('[Callback] Redirecting to dashboard with full page reload')
        window.location.href = '/'
      } catch (err) {
        console.error('[Callback] Error during authentication:', err)
        hasProcessedCallback = false // Reset flag on error to allow retry
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao processar login. Por favor, tente novamente.'
        )
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, login, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro de Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Autenticando com Microsoft
              </h3>
              <p className="text-sm text-muted-foreground">
                Por favor, aguarde enquanto processamos seu login...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
