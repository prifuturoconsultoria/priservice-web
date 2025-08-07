import { getServiceSheetByToken } from "@/lib/supabase"
import { ApprovalButtons } from "@/components/approval-buttons"
import { PDFGenerator } from "@/components/pdf-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  MessageSquare,
  Shield,
  AlertTriangle,
  Type
} from "lucide-react"

export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params
  const serviceSheet = await getServiceSheetByToken(resolvedParams.token)

  if (!serviceSheet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-red-700">
                Link Inválido ou Expirado
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground leading-relaxed">
                O link de aprovação da ficha de serviço é inválido ou expirou. 
                Por favor, entre em contato com o técnico responsável para obter um novo link.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium">
                💡 Dica: Verifique se você está usando o link mais recente enviado por email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = {
    pending: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Aguardando Aprovação",
      bgColor: "from-amber-50 to-orange-50"
    },
    approved: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Aprovado",
      bgColor: "from-emerald-50 to-green-50"
    },
    rejected: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle className="h-4 w-4" />,
      label: "Rejeitado",
      bgColor: "from-red-50 to-pink-50"
    }
  }

  const currentStatus = statusConfig[serviceSheet.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br p-4 flex items-center justify-center",
      `from-slate-50 via-blue-50 to-indigo-50`
    )}>
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-xl md:text-2xl font-bold">
                  Aprovação de Serviço
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm md:text-base">
                  Revise os detalhes do serviço executado e forneça sua aprovação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* Service Overview */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 md:p-6 border border-slate-200 shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg md:text-2xl font-bold text-slate-800 flex-1">
                    {serviceSheet.subject || serviceSheet.projects?.name || 'Serviço'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <PDFGenerator 
                      serviceSheet={serviceSheet}
                      variant="outline" 
                      size="sm"
                    />
                    <div className="flex items-center gap-2">
                      {currentStatus.icon}
                      <Badge 
                        variant="outline" 
                        className={cn("font-semibold text-xs md:text-sm px-2 md:px-3 py-1 border-2", currentStatus.color)}
                      >
                        {currentStatus.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-slate-300" />
                
                {serviceSheet.subject && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        <Type className="h-3 w-3" />
                        Assunto
                      </div>
                      <p className="text-sm md:text-base font-semibold text-slate-800">{serviceSheet.subject}</p>
                    </div>
                    <Separator className="bg-slate-300" />
                  </>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      <User className="h-3 w-3" />
                      Técnico Responsável
                    </div>
                    <p className="text-sm md:text-base font-semibold text-slate-800">{serviceSheet.profiles?.full_name || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      <Building2 className="h-3 w-3" />
                      Empresa Cliente
                    </div>
                    <p className="text-sm md:text-base font-semibold text-slate-800">{serviceSheet.projects?.company || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      <Calendar className="h-3 w-3" />
                      Data do Serviço
                    </div>
                    <p className="text-sm md:text-base font-semibold text-slate-800">
                      {format(new Date(serviceSheet.service_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      <Clock className="h-3 w-3" />
                      Horário de Execução
                    </div>
                    <p className="text-sm md:text-base font-semibold text-slate-800">
                      {serviceSheet.start_time} - {serviceSheet.end_time}
                    </p>
                  </div>
                </div>

                {serviceSheet.approved_at && (
                  <>
                    <Separator className="bg-slate-300" />
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-xs md:text-sm text-slate-600 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        <span className="font-semibold">Processado em:</span> 
                        {format(new Date(serviceSheet.approved_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Activities Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg text-orange-800">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  Atividades Realizadas
                </CardTitle>
                <CardDescription className="text-orange-700 text-xs md:text-sm">
                  Descrição detalhada dos serviços executados pelo técnico
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="bg-white rounded-xl p-4 md:p-6 border border-orange-200 shadow-inner">
                  <div 
                    className="text-slate-700 leading-relaxed text-sm md:text-base prose prose-sm max-w-none [&>*]:m-0 [&>*:not(:last-child)]:mb-4 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-4 [&>ol]:ml-4 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>p]:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: serviceSheet.activity_description }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Previous Feedback Section */}
            {serviceSheet.client_feedback && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg text-blue-800">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                    Seu Feedback Anterior
                  </CardTitle>
                  <CardDescription className="text-blue-700 text-xs md:text-sm">
                    Comentários que você forneceu anteriormente sobre este serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="bg-white rounded-xl p-4 md:p-6 border border-blue-200 shadow-inner">
                    <p className="whitespace-pre-line text-slate-700 leading-relaxed text-sm md:text-base">
                      {serviceSheet.client_feedback}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Section */}
            {serviceSheet.status === "pending" ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg md:text-xl font-bold text-green-800">
                    Sua Aprovação é Necessária
                  </CardTitle>
                  <CardDescription className="text-green-700 text-sm md:text-base">
                    Por favor, revise as informações acima e indique se aprova ou rejeita este serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="bg-white rounded-xl p-4 md:p-6 border border-green-200">
                    <ApprovalButtons token={resolvedParams.token} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className={cn(
                "border-0 shadow-lg",
                serviceSheet.status === 'approved' 
                  ? "bg-gradient-to-br from-emerald-50 to-green-50" 
                  : "bg-gradient-to-br from-red-50 to-pink-50"
              )}>
                <CardContent className="p-4 md:p-6 text-center">
                  <div className={cn(
                    "rounded-xl p-4 md:p-6 border-2",
                    serviceSheet.status === 'approved' 
                      ? "bg-emerald-100 border-emerald-300" 
                      : "bg-red-100 border-red-300"
                  )}>
                    <div className="flex flex-col items-center space-y-3">
                      <div className={cn(
                        "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center",
                        serviceSheet.status === 'approved' 
                          ? "bg-emerald-200" 
                          : "bg-red-200"
                      )}>
                        {serviceSheet.status === 'approved' ? (
                          <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
                        ) : (
                          <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                        )}
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className={cn(
                          "text-lg md:text-xl font-bold",
                          serviceSheet.status === 'approved' ? "text-emerald-800" : "text-red-800"
                        )}>
                          Serviço {serviceSheet.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </h3>
                        <p className={cn(
                          "text-sm md:text-base",
                          serviceSheet.status === 'approved' ? "text-emerald-700" : "text-red-700"
                        )}>
                          Esta ficha de serviço já foi processada e não requer mais ações.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs md:text-sm text-muted-foreground">
            Este link é único. Não compartilhe com terceiros.
          </p>
        </div>
      </div>
    </div>
  )
}