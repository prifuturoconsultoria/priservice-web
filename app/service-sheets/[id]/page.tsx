"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { getServiceSheetById, deleteServiceSheet, resendApprovalEmail } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Eye, Edit, Trash2, Mail, ArrowLeft, Clock, Calendar, User, Building2, Phone, CheckCircle, XCircle, AlertCircle, MessageSquare, MoreVertical, Type } from "lucide-react"
import { PDFGenerator } from "@/components/pdf-generator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ServiceSheetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [serviceSheet, setServiceSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true;
    
    async function fetchServiceSheet() {
      try {
        const sheet = await getServiceSheetById(resolvedParams.id)
        if (mounted) {
          setServiceSheet(sheet)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching service sheet:', error)
        if (mounted) {
          setLoading(false)
          toast({
            title: "Erro",
            description: "Erro ao carregar ficha de serviço. Tente recarregar a página.",
            variant: "destructive",
          })
        }
      }
    }
    
    fetchServiceSheet()
    
    return () => {
      mounted = false;
    };
  }, [resolvedParams.id, toast])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteServiceSheet(resolvedParams.id)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Ficha de serviço excluída com sucesso!",
        })
        router.push("/service-sheets")
      } else {
        toast({
          title: "Erro",
          description: `Erro ao excluir: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir ficha de serviço",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleResendEmail = async () => {
    setResending(true)
    try {
      const result = await resendApprovalEmail(resolvedParams.id)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: result.message || "Email reenviado com sucesso!",
        })
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao reenviar email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reenviar email",
        variant: "destructive",
      })
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando ficha de serviço...</p>
        </div>
      </div>
    )
  }

  if (!serviceSheet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Ficha de serviço não encontrada</h2>
          <p className="text-muted-foreground">A ficha de serviço solicitada não existe ou foi removida.</p>
          <Button asChild>
            <Link href="/service-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Lista
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = {
    pending: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Pendente"
    },
    approved: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Aprovado"
    },
    rejected: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle className="h-4 w-4" />,
      label: "Rejeitado"
    }
  }

  const currentStatus = statusConfig[serviceSheet.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb & Back Navigation */}
        <nav className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link href="/service-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Fichas de Serviço
            </Link>
          </Button>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {currentStatus.icon}
                <Badge 
                  variant="outline" 
                  className={cn("font-medium border", currentStatus.color)}
                >
                  {currentStatus.label}
                </Badge>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md font-mono">
                  ID: {serviceSheet.id.slice(0, 8)}
                </span>
              </div>
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-2">
                  {serviceSheet.subject || serviceSheet.projects?.name || 'N/A'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {serviceSheet.projects?.name || 'Projeto não especificado'} • Ficha de serviço técnico
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* PDF Download Button */}
              <PDFGenerator 
                serviceSheet={serviceSheet}
                variant="outline" 
                size="default" 
                className="hidden sm:flex"
              />
              
              {serviceSheet.status !== "approved" && (
                <>
                  <Button asChild size="default" className="hidden sm:flex">
                    <Link href={`/service-sheets/${serviceSheet.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={resending}
                    size="default"
                    className="hidden sm:flex"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {resending ? "Reenviando..." : "Reenviar Email"}
                  </Button>
                </>
              )}
              
              {/* Mobile Actions Menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <PDFGenerator 
                        serviceSheet={serviceSheet}
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start"
                      />
                    </DropdownMenuItem>
                    {serviceSheet.status !== "approved" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/service-sheets/${serviceSheet.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleResendEmail} disabled={resending}>
                          <Mail className="mr-2 h-4 w-4" />
                          {resending ? "Reenviando..." : "Reenviar Email"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="default">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Excluir</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A ficha de serviço "{serviceSheet.projects?.name || 'N/A'}" 
                      será permanentemente removida do sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting}
                    >
                      {deleting ? "Excluindo..." : "Confirmar exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Information */}
          <div className="xl:col-span-2 space-y-8">
            {/* Project Information */}
            <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm"></div>
                  Informações do Projeto
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Detalhes sobre o serviço executado
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {serviceSheet.subject && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Type className="h-3 w-3" />
                        Assunto
                      </div>
                      <p className="text-base md:text-lg font-semibold text-foreground">{serviceSheet.subject}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <User className="h-3 w-3" />
                      Técnico Responsável
                    </div>
                    <p className="text-base md:text-lg font-semibold text-foreground">{serviceSheet.profiles?.full_name || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <Calendar className="h-3 w-3" />
                      Data do Serviço
                    </div>
                    <p className="text-base md:text-lg font-semibold text-foreground">
                      {format(new Date(serviceSheet.service_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <Clock className="h-3 w-3" />
                      Horário de Execução
                    </div>
                    <p className="text-base md:text-lg font-semibold text-foreground">
                      {serviceSheet.start_time} - {serviceSheet.end_time}
                    </p>
                  </div>
                  
                  {serviceSheet.approved_at && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <CheckCircle className="h-3 w-3" />
                        Data de Aprovação
                      </div>
                      <p className="text-base md:text-lg font-semibold text-foreground">
                        {format(new Date(serviceSheet.approved_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Description */}
            <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm"></div>
                  Atividades Realizadas
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Descrição detalhada dos serviços executados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="prose prose-slate max-w-none">
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 md:p-6 border border-slate-200 shadow-inner">
                    <div 
                      className="text-slate-800 leading-relaxed text-sm md:text-base prose prose-sm max-w-none [&>*]:m-0 [&>*:not(:last-child)]:mb-4 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-4 [&>ol]:ml-4 [&>blockquote]:border-l-4 [&>blockquote]:border-slate-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>p]:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: serviceSheet.activity_description }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Feedback */}
            {serviceSheet.client_feedback && (
              <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    Feedback do Cliente
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Avaliação e comentários do cliente sobre o serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 md:p-6 border border-emerald-200 shadow-inner">
                    <p className="text-emerald-900 leading-relaxed whitespace-pre-line text-sm md:text-base m-0">
                      {serviceSheet.client_feedback}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar Information */}
          <div className="space-y-8">
            {/* Client Information */}
            <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm"></div>
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Building2 className="h-3 w-3" />
                    Empresa
                  </div>
                  <p className="font-semibold text-sm md:text-base text-foreground break-words">
                    {serviceSheet.projects?.company || 'N/A'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <User className="h-3 w-3" />
                    Pessoa de Contato
                  </div>
                  <p className="font-semibold text-sm md:text-base text-foreground">
                    {serviceSheet.client_contact_name}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Mail className="h-3 w-3" />
                    Email de Contato
                  </div>
                  <p className="font-medium text-xs md:text-sm text-foreground break-all bg-muted/50 px-2 py-1 rounded-lg">
                    {serviceSheet.client_contact_email}
                  </p>
                </div>
                
                {serviceSheet.client_contact_phone && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Phone className="h-3 w-3" />
                        Telefone
                      </div>
                      <p className="font-medium text-xs md:text-sm text-foreground bg-muted/50 px-2 py-1 rounded-lg">
                        {serviceSheet.client_contact_phone}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline & Metadata */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-muted/20 to-muted/40 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Clock className="h-4 w-4 text-slate-600" />
                  Histórico da Ficha
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Cronologia de eventos importantes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shadow-sm"></div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-sm text-foreground">Ficha criada</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(serviceSheet.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  
                  {serviceSheet.updated_at !== serviceSheet.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shadow-sm"></div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-sm text-foreground">Última atualização</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(serviceSheet.updated_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {serviceSheet.approved_at && (
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shadow-sm",
                        serviceSheet.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                      )}></div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-sm text-foreground">
                          {serviceSheet.status === 'approved' ? 'Aprovada pelo cliente' : 'Rejeitada pelo cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(serviceSheet.approved_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}