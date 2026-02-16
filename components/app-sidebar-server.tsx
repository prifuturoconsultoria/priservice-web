import { AppSidebarClient } from "./app-sidebar-client"

/**
 * Server wrapper for AppSidebarClient
 * Note: AppSidebarClient handles role-based filtering internally via useAuth()
 */
export async function AppSidebarServer() {
  return <AppSidebarClient />
}