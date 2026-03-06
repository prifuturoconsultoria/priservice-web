import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Wrench, Eye } from "lucide-react"

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as funções dos usuários do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total de Usuários" },
          { icon: Shield, label: "Administradores" },
          { icon: Wrench, label: "Técnicos" },
          { icon: Eye, label: "Verificadores" },
        ].map(({ icon: Icon, label }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-10 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
