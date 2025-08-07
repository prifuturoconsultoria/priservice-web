import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { cookies } from "next/headers"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebarServer } from "@/components/app-sidebar-server"
import { createClient } from "@/utils/supabase/server"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PriService",
  description: "Sistema de fichas de serviço.",
  generator: 'v0.dev',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/icon.png',
  },
  manifest: '/manifest.json',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarCookie !== "false"
  
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {user ? (
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebarServer />
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SidebarTrigger />
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        ) : (
          children
        )}
        <Toaster />
      </body>
    </html>
  )
}
