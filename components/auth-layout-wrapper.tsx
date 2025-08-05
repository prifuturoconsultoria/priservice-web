"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface AuthLayoutWrapperProps {
  children: React.ReactNode
}

export function AuthLayoutWrapper({ children }: AuthLayoutWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Routes that don't need the sidebar layout
  const publicRoutes = ['/login']
  const isApprovalRoute = pathname.startsWith('/approval/')
  const isPublicRoute = publicRoutes.includes(pathname)
  const usePublicLayout = isPublicRoute || isApprovalRoute

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Auth error:', error)
        }
        setUser(user)
      } catch (error) {
        console.error('Failed to get user:', error)
      } finally {
        setLoading(false)
        setInitialCheckDone(true)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (initialCheckDone) {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [initialCheckDone])

  // Show loading only on initial load
  if (loading && !initialCheckDone) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  // For public routes (login, approval), don't show sidebar
  if (usePublicLayout) {
    return <>{children}</>
  }

  // For authenticated routes, show sidebar layout
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold">Painel</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}