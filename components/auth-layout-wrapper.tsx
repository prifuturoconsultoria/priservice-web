"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebarClient } from "@/components/app-sidebar-client"

interface AuthLayoutWrapperProps {
  children: React.ReactNode
}

export function AuthLayoutWrapper({ children }: AuthLayoutWrapperProps) {
  const pathname = usePathname()

  // Routes that don't need the sidebar layout
  const publicRoutes = ['/login']
  const isApprovalRoute = pathname.startsWith('/approval/')
  const isAuthRoute = pathname.startsWith('/auth/')
  const isPublicRoute = publicRoutes.includes(pathname)
  const usePublicLayout = isPublicRoute || isApprovalRoute || isAuthRoute

  // For public routes (login, approval, auth callback), don't show sidebar
  if (usePublicLayout) {
    return <>{children}</>
  }

  // For authenticated routes, show sidebar layout
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarClient />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:px-6">
          <SidebarTrigger />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
