'use client'

/**
 * Login Page with Microsoft Azure AD Authentication
 *
 * Redirects users to Microsoft OAuth for authentication
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAzureLoginUrl } from '@/lib/azure-auth'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

// Simple Microsoft logo SVG icon
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 23 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0h11v11H0z" fill="#F25022" />
      <path d="M12 0h11v11H12z" fill="#7FBA00" />
      <path d="M0 12h11v11H0z" fill="#00A4EF" />
      <path d="M12 12h11v11H12z" fill="#FFB900" />
    </svg>
  )
}

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Note: Redirect is handled by middleware, no need for client-side redirect
  // This prevents double-redirect issues

  const handleLogin = () => {
    try {
      setIsRedirecting(true)
      const loginUrl = getAzureLoginUrl()
      window.location.href = loginUrl
    } catch {
      alert('Erro ao iniciar login.')
      setIsRedirecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden relative hover:shadow-3xl transition-shadow duration-500">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <CardHeader className="space-y-6 text-center pt-8 pb-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
            <span className="text-3xl font-bold">PS</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              PriService
            </CardTitle>
            <CardDescription className="text-base">
              Sistema de Gestão de Fichas de Serviço
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-base font-medium bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
            size="lg"
            disabled={isRedirecting}
            variant="outline"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <MicrosoftIcon className="mr-3 h-5 w-5" />
                Entrar com Microsoft
              </>
            )}
          </Button>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Acesso seguro via Microsoft 365
            </p>
            <p className="text-xs text-muted-foreground">
              Use suas credenciais corporativas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
