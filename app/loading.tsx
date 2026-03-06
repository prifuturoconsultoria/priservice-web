import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, XCircle, Activity, PieChart, BarChart3 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">Dashboard</h1>
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileText, color: "blue", label: "Total de Fichas" },
          { icon: Clock, color: "amber", label: "Pendentes" },
          { icon: CheckCircle, color: "emerald", label: "Aprovadas" },
          { icon: XCircle, color: "red", label: "Rejeitadas" },
        ].map(({ icon: Icon, color, label }) => (
          <Card key={label} className={`border-l-4 border-l-${color}-500`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <div className={`h-8 w-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 text-${color}-600`} />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Distribution + Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Distribuição Detalhada
            </CardTitle>
            <CardDescription>Análise detalhada do status das fichas de serviço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Métricas
            </CardTitle>
            <CardDescription>Indicadores de performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Service Sheets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Fichas Recentes
          </CardTitle>
          <CardDescription>Últimas fichas de serviço criadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-12 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
