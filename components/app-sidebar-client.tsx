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
import { usePathname } from "next/navigation";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon mapping
const iconMap = {
  Home,
  FileText,
  Users,
  FolderOpen,
};

// Menu items
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

function isRouteActive(pathname: string, url: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(url + "/");
}

export function AppSidebarClient() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const profile = user ? { role: user.role, full_name: user.fullName } : null;

  // Filter menu items based on user role
  let mainItems = allMainItems;
  let secondaryItems = allSecondaryItems;

  if (profile?.role === "observer") {
    mainItems = allMainItems;
    secondaryItems = [];
  } else if (profile?.role === "technician") {
    mainItems = allMainItems;
    secondaryItems = allSecondaryItems.filter(
      (item) => item.url !== "/admin/users"
    );
  }

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

  const renderMenuItems = (items: typeof allMainItems) =>
    items.map((item) => {
      const IconComponent = iconMap[item.icon as keyof typeof iconMap];
      const active = isRouteActive(pathname, item.url);
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
            <Link href={item.url}>
              <IconComponent className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  // Get user initials
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-200/50">
                <span className="text-sm font-bold">PS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">
                  PriService
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Gestão de Serviços
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.role === "admin" && secondaryItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderMenuItems(secondaryItems)}</SidebarMenu>
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
                  <SidebarMenuButton className="h-auto py-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className="text-sm font-medium truncate max-w-[140px]">
                        {user.fullName || "Usuário"}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                        {getRoleTranslation(user.role)}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  align="start"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">
                      {user.fullName || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
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
