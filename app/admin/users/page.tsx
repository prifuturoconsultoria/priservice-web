import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllUsers } from "@/lib/admin"
import { Users } from "lucide-react"
import { getUser, getUserProfile } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const users = await getAllUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários registrados no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Com privilégios administrativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'technician').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários técnicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Hoje</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                const lastSignIn = new Date(u.last_sign_in_at || 0)
                const today = new Date()
                return lastSignIn.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fizeram login hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminUsersClient initialUsers={users} />
    </div>
  )
}