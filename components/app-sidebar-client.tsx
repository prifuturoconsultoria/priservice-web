"use client";

import {
  LogOut,
  ChevronUp,
  User2,
  Home,
  FileText,
  Users,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getRoleTranslation } from "@/lib/role-translations";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon mapping
const iconMap = {
  Home,
  FileText,
  Users,
  FolderOpen,
};

// Menu items with icon names instead of components
const allMainItems = [
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
];

const allSecondaryItems = [
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
];

export function AppSidebarClient() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Get user profile from local state
  // Note: profile info is part of user object from AuthContext
  const profile = user ? { role: user.role, full_name: user.fullName } : null;

  // Filter menu items based on user role
  let mainItems = allMainItems;
  let secondaryItems = allSecondaryItems;

  if (profile?.role === "observer") {
    // Observers can only see Dashboard and Service Sheets
    mainItems = allMainItems;
    secondaryItems = []; // Remove all secondary items
  } else if (profile?.role === "technician") {
    // Technicians can see everything except Users
    mainItems = allMainItems;
    secondaryItems = allSecondaryItems.filter(
      (item) => item.url !== "/admin/users"
    );
  }
  // Admins see everything

  const handleSignOut = async () => {
    try {
      logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">PS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">PriService</span>
                <span className="text-xs text-muted-foreground">v1.0</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const IconComponent =
                  iconMap[item.icon as keyof typeof iconMap];
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <IconComponent />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {secondaryItems.map((item) => {
                    const IconComponent =
                      iconMap[item.icon as keyof typeof iconMap];
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>
                            <IconComponent />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium truncate">
                        {user.fullName || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {getRoleTranslation(user.role)}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-56">
                  <DropdownMenuItem disabled>
                    <User2 className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {user.fullName || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
