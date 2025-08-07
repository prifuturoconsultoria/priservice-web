import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getAllServiceSheets } from "@/lib/supabase"
import { getUser, getUserProfile } from "@/lib/auth"
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns"
import { redirect } from 'next/navigation'
import { TrendingUp, FileText, CheckCircle, XCircle, Clock, Activity, BarChart3, PieChart, Calendar } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard-charts"

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  
  const profile = await getUserProfile()
  const serviceSheets = await getAllServiceSheets()

  // Calculate statistics
  const totalSheets = serviceSheets.length
  const pendingSheets = serviceSheets.filter((s) => s.status === "pending").length
  const approvedSheets = serviceSheets.filter((s) => s.status === "approved").length
  const rejectedSheets = serviceSheets.filter((s) => s.status === "rejected").length

  // Calculate percentages
  const approvalRate = totalSheets > 0 ? (approvedSheets / totalSheets) * 100 : 0
  const pendingRate = totalSheets > 0 ? (pendingSheets / totalSheets) * 100 : 0
  const rejectionRate = totalSheets > 0 ? (rejectedSheets / totalSheets) * 100 : 0

  // Prepare chart data
  const statusData = [
    { name: 'Aprovadas', value: approvedSheets, color: '#10b981' },
    { name: 'Pendentes', value: pendingSheets, color: '#f59e0b' },
    { name: 'Rejeitadas', value: rejectedSheets, color: '#ef4444' }
  ]

  // Activity data for last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  })

  const activityData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const sheetsForDay = serviceSheets.filter(sheet => 
      format(parseISO(sheet.created_at), 'yyyy-MM-dd') === dayStr
    ).length
    return {
      date: format(day, 'dd/MM'),
      sheets: sheetsForDay,
      day: format(day, 'EEEE').substring(0, 3)
    }
  })

  // Monthly trend data
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = subDays(new Date(), i * 30)
    const monthSheets = serviceSheets.filter(sheet => {
      const sheetDate = parseISO(sheet.created_at)
      return sheetDate >= subDays(date, 30) && sheetDate <= date
    }).length
    
    monthlyData.push({
      month: format(date, 'MMM'),
      sheets: monthSheets
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {profile?.full_name || user.user_metadata?.full_name || user.email}
          </p>
        </div>
        {profile?.role !== 'observer' && (
          <Button asChild>
            <Link href="/service-sheets/new">
              <FileText className="mr-2 h-4 w-4" />
              Nova Ficha
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fichas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSheets}</div>
            <p className="text-xs text-muted-foreground">
              Todas as fichas de serviço
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingSheets}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedSheets}</div>
            <p className="text-xs text-muted-foreground">
              Aprovadas pelos clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedSheets}</div>
            <p className="text-xs text-muted-foreground">
              Rejeitadas pelos clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <DashboardCharts 
        statusData={statusData}
        activityData={activityData}
        monthlyData={monthlyData}
        totalSheets={totalSheets}
        approvalRate={approvalRate}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição Detalhada
            </CardTitle>
            <CardDescription>
              Análise detalhada do status das fichas de serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Aprovadas</span>
                  </div>
                  <span className="font-medium">{approvedSheets} ({approvalRate.toFixed(1)}%)</span>
                </div>
                <Progress value={approvalRate} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Pendentes</span>
                  </div>
                  <span className="font-medium">{pendingSheets} ({pendingRate.toFixed(1)}%)</span>
                </div>
                <Progress value={pendingRate} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Rejeitadas</span>
                  </div>
                  <span className="font-medium">{rejectedSheets} ({rejectionRate.toFixed(1)}%)</span>
                </div>
                <Progress value={rejectionRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métricas
            </CardTitle>
            <CardDescription>
              Indicadores de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{approvalRate.toFixed(1)}%</div>
                <div className="text-sm text-green-600">Taxa de Aprovação</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{totalSheets}</div>
                <div className="text-sm text-blue-600">Total de Fichas</div>
              </div>
              
              {totalSheets > 0 && (
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">
                    {(approvedSheets + rejectedSheets) / totalSheets > 0.8 ? '🔥' : '📈'}
                  </div>
                  <div className="text-sm text-purple-600">
                    {(approvedSheets + rejectedSheets) / totalSheets > 0.8 ? 'Excelente!' : 'Em Progresso'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Service Sheets */}
      <Card>
        <CardHeader>
          <CardTitle>Fichas Recentes</CardTitle>
          <CardDescription>
            Últimas fichas de serviço criadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceSheets.slice(0, 5).map((sheet) => (
              <div key={sheet.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{sheet.project_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sheet.client_company} • {format(new Date(sheet.service_date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    sheet.status === 'approved' ? 'bg-green-100 text-green-800' :
                    sheet.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sheet.status === 'pending' ? 'Pendente' : 
                     sheet.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/service-sheets/${sheet.id}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {serviceSheets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ficha de serviço encontrada.
                {profile?.role !== 'observer' && (
                  <Link href="/service-sheets/new" className="text-primary hover:underline ml-1">
                    Crie a primeira ficha
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
