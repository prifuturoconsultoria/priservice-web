"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'
import { TrendingUp, Activity, Calendar, BarChart3 } from "lucide-react"

interface DashboardChartsProps {
  statusData: Array<{ name: string; value: number; color: string }>
  activityData: Array<{ date: string; sheets: number; day: string }>
  monthlyData: Array<{ month: string; sheets: number }>
  totalSheets: number
  approvalRate: number
}

export function DashboardCharts({ 
  statusData, 
  activityData, 
  monthlyData, 
  totalSheets, 
  approvalRate 
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Pie Chart - Status Distribution */}
      <Card className="col-span-1 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
            Status Overview
          </CardTitle>
          <CardDescription>Distribuição atual por status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Fichas']} 
                  labelStyle={{ color: '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Last 7 Days Activity */}
      <Card className="col-span-1 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-blue-600" />
            Atividade Semanal
          </CardTitle>
          <CardDescription>Fichas criadas nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Fichas']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar 
                  dataKey="sheets" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart - Monthly Trend */}
      <Card className="col-span-1 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Tendência Mensal
          </CardTitle>
          <CardDescription>Evolução ao longo dos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Fichas']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="sheets" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="col-span-full lg:col-span-3 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Resumo de Performance
          </CardTitle>
          <CardDescription>
            Principais métricas e indicadores de desempenho do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-xl border border-blue-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
              <div className="text-3xl font-bold text-blue-700">{totalSheets}</div>
              <div className="text-sm font-medium text-blue-600 mt-1">Total de Fichas</div>
              <div className="text-xs text-blue-400 mt-2">
                {totalSheets > 0 ? 'Sistema ativo' : 'Pronto para uso'}
              </div>
            </div>

            <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-xl border border-emerald-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200">
              <div className="text-3xl font-bold text-emerald-700">{approvalRate.toFixed(1)}%</div>
              <div className="text-sm font-medium text-emerald-600 mt-1">Taxa de Aprovação</div>
              <div className="text-xs text-emerald-400 mt-2">
                {approvalRate > 80 ? 'Excelente' : approvalRate > 60 ? 'Boa' : 'Regular'}
              </div>
            </div>

            <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-purple-100/60 rounded-xl border border-purple-100 hover:shadow-md hover:border-purple-200 transition-all duration-200">
              <div className="text-3xl font-bold text-purple-700">
                {activityData.reduce((sum, day) => sum + day.sheets, 0)}
              </div>
              <div className="text-sm font-medium text-purple-600 mt-1">Esta Semana</div>
              <div className="text-xs text-purple-400 mt-2">
                {activityData.reduce((sum, day) => sum + day.sheets, 0) > 5 ? 'Alta atividade' : 'Em crescimento'}
              </div>
            </div>

            <div className="text-center p-5 bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-xl border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all duration-200">
              <div className="text-3xl font-bold text-orange-700">
                {monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.sheets)) : 0}
              </div>
              <div className="text-sm font-medium text-orange-600 mt-1">Pico Mensal</div>
              <div className="text-xs text-orange-400 mt-2">
                Melhor mês
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}