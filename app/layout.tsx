import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { MsalProviderWrapper } from "@/components/msal-provider-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PriService",
  description: "Sistema de Gestão de Fichas de Serviço",
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <MsalProviderWrapper>{children}</MsalProviderWrapper>
        <Toaster />
      </body>
    </html>
  )
}
