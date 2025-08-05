import type React from "react"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}