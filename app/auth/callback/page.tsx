'use client'

/**
 * OAuth Callback Page
 *
 * Handles the redirect from Microsoft OAuth with authorization code
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { validateState, clearStoredState } from '@/lib/azure-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'

let hasProcessedCallback = false

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (hasProcessedCallback) return

    const handleCallback = async () => {
      hasProcessedCallback = true
      setIsProcessing(true)

      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          if (errorParam === 'access_denied') {
            setError('Login cancelado. Você precisa autorizar o acesso para continuar.')
          } else {
            setError(`Erro de autenticação: ${errorDescription || errorParam}`)
          }
          return
        }

        if (!code || !state) {
          setError('Parâmetros de autenticação inválidos. Por favor, tente fazer login novamente.')
          return
        }

        validateState(state)
        clearStoredState()

        // Attempt login once, with retry logic
        let lastError: Error | null = null
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await login(code)
            router.push('/')
            return
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            if (attempt < 3) {
              // Wait 1 second before retry
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }

        // All retries failed
        throw lastError || new Error('Login failed after 3 attempts')
      } catch (err) {
        hasProcessedCallback = false
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
