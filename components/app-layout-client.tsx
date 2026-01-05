'use client'

/**
 * Client-side Layout Component
 *
 * Conditionally renders sidebar based on authentication state
 */

import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { AppSidebarClient } from '@/components/app-sidebar-client'
import { SidebarInset, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar'
import { Loader2 } from 'lucide-react'

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  // Public routes that don't need sidebar
  const publicRoutes = ['/login', '/auth/callback', '/approval']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Show loading spinner during auth initialization
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Render without sidebar for public routes or unauthenticated users
  if (isPublicRoute || !isAuthenticated) {
    return <>{children}</>
  }

  // Render with sidebar for authenticated users
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarClient />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
