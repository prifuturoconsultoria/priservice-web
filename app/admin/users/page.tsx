import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllUsers } from "@/lib/service-sheets-api"
import { Users, Shield, Wrench, Eye } from "lucide-react"
import { getUser, getUserProfile } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage() {
  // Parallel: auth + data fetch
  const [user, profile, users] = await Promise.all([
    getUser(),
    getUserProfile(),
    getAllUsers(),
  ])

  if (!user) redirect('/login')
  if (profile?.role !== 'admin') redirect('/')

  const adminCount = users.filter(u => u.role === 'admin').length
  const technicianCount = users.filter(u => u.role === 'technician').length
  const observerCount = users.filter(u => u.role === 'observer').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as funções dos usuários do sistema
        </p>
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
              Registrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Com privilégios administrativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
            <Wrench className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technicianCount}</div>
            <p className="text-xs text-muted-foreground">
              Usuários técnicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificadores</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observerCount}</div>
            <p className="text-xs text-muted-foreground">
              Usuários verificadores
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminUsersClient initialUsers={users} />
    </div>
  )
}
