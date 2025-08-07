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
    title: "Projetos",
    url: "/projects",
    icon: "FolderOpen",
  },
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

  // Filter menu items based on user role
  let filteredMainItems = mainItems;
  let filteredSecondaryItems = secondaryItems;

  if (profile?.role === 'observer') {
    // Observers can only see Dashboard and Service Sheets
    filteredMainItems = mainItems; // Keep all main items (Dashboard and Service Sheets)
    filteredSecondaryItems = []; // Remove all secondary items (Projects, Users)
  } else if (profile?.role === 'technician') {
    // Technicians can see everything except Users
    filteredMainItems = mainItems;
    filteredSecondaryItems = secondaryItems.filter(item => item.url !== '/admin/users');
  }
  // Admins see everything (no filtering needed)

  return (
    <AppSidebarClient 
      user={user}
      profile={profile}
      mainItems={filteredMainItems}
      secondaryItems={filteredSecondaryItems}
    />
  )
}