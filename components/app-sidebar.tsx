"use client"

import { Home, Search, Settings, FileText, LogOut, Users, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronUp, User2 } from "lucide-react"

// Menu items.
const mainItems = [
  {
    title: "Painel",
    url: "/",
    icon: Home,
  },
  {
    title: "Fichas de Serviço",
    url: "/service-sheets",
    icon: FileText,
  },
]

const secondaryItems = [
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
  },
]

export function AppSidebar() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        try {
          // Get user profile with role - bypass RLS temporarily
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('id', user.id)
            .maybeSingle()
          
          if (error) {
            console.error('Erro ao carregar perfil:', error)
            // Se falhar, criar o perfil
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || user.email,
                role: 'admin'
              })
              .select()
              .single()
            setProfile(newProfile)
          } else {
            setProfile(profile)
          }
        } catch (err) {
          console.error('Erro crítico ao carregar perfil:', err)
        }
      }
      
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('id', currentUser.id)
            .maybeSingle()
          
          if (error) {
            console.error('Erro ao carregar perfil no auth change:', error)
          }
          setProfile(profile)
        } catch (err) {
          console.error('Erro crítico no auth change:', err)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <span>...</span>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }
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
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.role === 'admin' && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {secondaryItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
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
                      {user?.user_metadata?.full_name || profile?.full_name || "Usuário"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {profile?.role === 'admin' ? 'Administrador' : 'Técnico'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem disabled>
                  <User2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">{user?.user_metadata?.full_name || profile?.full_name || "Usuário"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
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
    </Sidebar>
  )
}
