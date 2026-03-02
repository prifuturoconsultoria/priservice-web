import { getServiceSheetByToken } from "@/lib/service-sheets-api"
import { ApprovalButtons } from "@/components/approval-buttons"
import { PDFGenerator } from "@/components/pdf-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"

export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params
  const response = await getServiceSheetByToken(resolvedParams.token)
  const serviceSheet = response.data

  if (!serviceSheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl text-red-700">
                Link Inválido ou Expirado
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                O link de aprovação é inválido ou expirou. Entre em contato com o técnico responsável.
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const statusConfig = {
    pending: {
      color: "bg-amber-100 text-amber-800 border-amber-300",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: "Pendente",
    },
    approved: {
      color: "bg-green-100 text-green-800 border-green-300",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: "Aprovado",
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Rejeitado",
    }
  }

  const currentStatus = statusConfig[serviceSheet.status as keyof typeof statusConfig] || statusConfig.pending
  const lineCount = serviceSheet.lines?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Aprovação de Folha de Serviço</h1>
          <p className="text-sm text-muted-foreground">
            Revise os detalhes abaixo e forneça sua aprovação
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardContent className="p-6 space-y-6">

            {/* Status + PDF row */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-xs px-2.5 py-1 border font-medium", currentStatus.color)}>
                <span className="flex items-center gap-1.5">
                  {currentStatus.icon}
                  {currentStatus.label}
                </span>
              </Badge>
              <PDFGenerator
                serviceSheet={serviceSheet}
                variant="outline"
                size="sm"
              />
            </div>

            <Separator />

            {/* Detalhes da Intervenção */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Detalhes da Intervenção</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div>
                  <span className="text-muted-foreground">Projecto</span>
                  <p className="font-medium text-gray-900">{serviceSheet.project?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Empresa</span>
                  <p className="font-medium text-gray-900">{serviceSheet.project?.company || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Técnico Responsável</span>
                  <p className="font-medium text-gray-900">{serviceSheet.createdBy?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total de Horas</span>
                  <p className="font-medium text-gray-900">
                    {serviceSheet.totalHours != null
                      ? `${Number(serviceSheet.totalHours).toFixed(1)}h (${lineCount} ${lineCount === 1 ? 'dia' : 'dias'})`
                      : 'N/A'}
                  </p>
                </div>
                {serviceSheet.subject && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Assunto</span>
                    <p className="font-medium text-gray-900">{serviceSheet.subject}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Dias de Trabalho */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Dias de Trabalho</h2>
              {serviceSheet.lines && serviceSheet.lines.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs font-semibold text-gray-600">Data</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Início</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Fim</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Horas</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceSheet.lines.map((line, index) => (
                        <TableRow key={line.id || index}>
                          <TableCell className="text-sm">
                            {format(new Date(line.serviceDate), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{line.startTime}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{line.endTime}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {line.hours != null ? `${Number(line.hours).toFixed(1)}h` : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {line.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right text-sm font-semibold">
                          TOTAL
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {serviceSheet.totalHours != null ? `${Number(serviceSheet.totalHours).toFixed(1)}h` : '-'}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dia de trabalho registado.</p>
              )}
            </div>

            {/* Descrição das Atividades */}
            {serviceSheet.activityDescription && (
              <>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Descrição das Atividades</h2>
                  <div
                    className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: serviceSheet.activityDescription }}
                  />
                </div>
              </>
            )}

            {/* Feedback anterior */}
            {serviceSheet.clientFeedback && (
              <>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Feedback Anterior</h2>
                  <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
                    {serviceSheet.clientFeedback}
                  </p>
                </div>
              </>
            )}

            {/* Processado em */}
            {serviceSheet.approvedAt && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Processado em {format(new Date(serviceSheet.approvedAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Card */}
        {serviceSheet.status === "pending" ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-center">Sua Aprovação</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Revise as informações acima e indique se aprova ou rejeita este serviço
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ApprovalButtons token={resolvedParams.token} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  serviceSheet.status === 'approved' ? "bg-green-100" : "bg-red-100"
                )}>
                  {serviceSheet.status === 'approved' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    serviceSheet.status === 'approved' ? "text-green-800" : "text-red-800"
                  )}>
                    Serviço {serviceSheet.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Esta ficha já foi processada e não requer mais ações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Este link é único. Não compartilhe com terceiros.
        </p>
      </div>
    </div>
  )
}
