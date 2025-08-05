import { AppSidebarClient } from "./app-sidebar-client"
import { getUser, getUserProfile } from "@/lib/auth"

// Menu items with icon names instead of components
const mainItems = [
  {
    title: "Painel",
    url: "/",
    icon: "Home",
  },
  {
    title: "Fichas de Serviço",
    url: "/service-sheets",
    icon: "FileText",
  },
]

const secondaryItems = [
  {
    title: "Usuários",
    url: "/admin/users",
    icon: "Users",
  },
]

export async function AppSidebarServer() {
  const user = await getUser()
  const profile = await getUserProfile()

  // If no user, show basic sidebar (shouldn't happen in protected routes)
  if (!user) {
    return (
      <AppSidebarClient 
        user={null}
        profile={null}
        mainItems={mainItems}
        secondaryItems={secondaryItems}
      />
    )
  }

  return (
    <AppSidebarClient 
      user={user}
      profile={profile}
      mainItems={mainItems}
      secondaryItems={secondaryItems}
    />
  )
}