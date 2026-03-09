"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns"
import { TrendingUp, FileText, CheckCircle, XCircle, Clock, Activity, BarChart3, PieChart } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard-charts"
import { Skeleton } from "@/components/ui/skeleton"
import { useServiceSheets, useProfile } from "@/lib/hooks/use-data"

export function DashboardClient() {
  const { data: serviceSheets = [], isLoading } = useServiceSheets()
  const { data: profile, isLoading: profileLoading } = useProfile()

  const stats = useMemo(() => {
    const totalSheets = serviceSheets.length
    const pendingSheets = serviceSheets.filter((s: any) => s.status === "pending").length
    const approvedSheets = serviceSheets.filter((s: any) => s.status === "approved").length
    const rejectedSheets = serviceSheets.filter((s: any) => s.status === "rejected").length

    const approvalRate = totalSheets > 0 ? (approvedSheets / totalSheets) * 100 : 0
    const pendingRate = totalSheets > 0 ? (pendingSheets / totalSheets) * 100 : 0
    const rejectionRate = totalSheets > 0 ? (rejectedSheets / totalSheets) * 100 : 0

    const statusData = [
      { name: 'Aprovadas', value: approvedSheets, color: '#10b981' },
      { name: 'Pendentes', value: pendingSheets, color: '#f59e0b' },
      { name: 'Rejeitadas', value: rejectedSheets, color: '#ef4444' }
    ]

    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    })

    const activityData = last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const sheetsForDay = serviceSheets.filter((sheet: any) =>
        format(parseISO(sheet.createdAt), 'yyyy-MM-dd') === dayStr
      ).length
      return {
        date: format(day, 'dd/MM'),
        sheets: sheetsForDay,
        day: format(day, 'EEEE').substring(0, 3)
      }
    })

    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 30)
      const monthSheets = serviceSheets.filter((sheet: any) => {
        const sheetDate = parseISO(sheet.createdAt)
        return sheetDate >= subDays(date, 30) && sheetDate <= date
      }).length
      monthlyData.push({
        month: format(date, 'MMM'),
        sheets: monthSheets
      })
    }

    return {
      totalSheets, pendingSheets, approvedSheets, rejectedSheets,
      approvalRate, pendingRate, rejectionRate,
      statusData, activityData, monthlyData
    }
  }, [serviceSheets])

  const { totalSheets, pendingSheets, approvedSheets, rejectedSheets,
    approvalRate, pendingRate, rejectionRate,
    statusData, activityData, monthlyData } = stats

  if (isLoading || profileLoading) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta{profile ? `, ${profile.fullName || profile.full_name || profile.email}` : ''}
          </p>
        </div>
        {profile?.role !== 'observer' && (
          <Button asChild className="shadow-md hover:shadow-lg transition-all">
            <Link href="/service-sheets/new">
              <FileText className="mr-2 h-4 w-4" />
              Nova Ficha
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fichas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSheets}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas as fichas de serviço</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingSheets}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approvedSheets}</div>
            <p className="text-xs text-muted-foreground mt-1">Aprovadas pelos clientes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedSheets}</div>
            <p className="text-xs text-muted-foreground mt-1">Rejeitadas pelos clientes</p>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card className="lg:col-span-2 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Distribuição Detalhada
            </CardTitle>
            <CardDescription>Análise detalhada do status das fichas de serviço</CardDescription>
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
        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Métricas
            </CardTitle>
            <CardDescription>Indicadores de performance</CardDescription>
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
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Fichas Recentes
          </CardTitle>
          <CardDescription>Últimas fichas de serviço criadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceSheets.slice(0, 5).map((sheet: any, index: number) => (
              <div key={sheet.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/40 transition-colors duration-150">
                <div className="space-y-1">
                  <p className="font-medium">{sheet.project?.name || sheet.subject || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {sheet.project?.company || 'N/A'} • {sheet.lines?.[0]?.serviceDate ? format(new Date(sheet.lines[0].serviceDate), "dd/MM/yyyy") : format(new Date(sheet.createdAt), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    sheet.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                    sheet.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                    'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  }`}>
                    {sheet.status === 'pending' ? 'Pendente' :
                     sheet.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
                    <Link href={`/service-sheets/${sheet.id}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {serviceSheets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">Nenhuma ficha de serviço encontrada.</p>
                {profile?.role !== 'observer' && (
                  <Link href="/service-sheets/new" className="text-primary hover:underline mt-1 inline-block text-sm">
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
