"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
// Assuming these are correctly implemented and available
// import { getServiceSheetById, deleteServiceSheet, resendApprovalEmail } from "@/lib/supabase"
// Mocking supabase functions for demonstration purposes
const getServiceSheetById = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
  const mockData = {
    "1": {
      id: "1234567890abcdef",
      project_name: "Instalação de Rede Corporativa",
      technician_name: "João Silva",
      service_date: "2024-07-25T10:00:00Z",
      start_time: "09:00",
      end_time: "17:00",
      status: "pending",
      client_company: "Tech Solutions Ltda.",
      client_contact_name: "Maria Oliveira",
      client_contact_email: "maria.oliveira@techsolutions.com",
      client_contact_phone: "(11) 98765-4321",
      activity_description:
        "Instalação e configuração de 20 pontos de rede CAT6, crimpagem de conectores RJ45, testes de conectividade em todos os pontos. Configuração de roteador principal e 3 access points. Treinamento básico para equipe de TI do cliente sobre a nova infraestrutura.\n\nVerificado e documentado o layout da rede, incluindo a localização dos pontos de acesso e a topologia da rede. Todos os cabos foram devidamente identificados e organizados em racks.",
      client_feedback: null,
      created_at: "2024-07-25T08:00:00Z",
      updated_at: "2024-07-25T08:00:00Z",
      approved_at: null,
    },
    "2": {
      id: "abcdef1234567890",
      project_name: "Manutenção Preventiva de Servidores",
      technician_name: "Ana Costa",
      service_date: "2024-07-20T10:00:00Z",
      start_time: "10:00",
      end_time: "14:00",
      status: "approved",
      client_company: "DataSecure S.A.",
      client_contact_name: "Carlos Mendes",
      client_contact_email: "carlos.mendes@datasecure.com",
      client_contact_phone: null,
      activity_description:
        "Verificação de logs de sistema, atualização de patches de segurança, otimização de desempenho de banco de dados, backup completo dos dados críticos. Limpeza física dos servidores e verificação de temperatura.",
      client_feedback:
        "Serviço excelente e rápido. A equipe foi muito profissional e resolveu todos os nossos problemas.",
      created_at: "2024-07-19T09:00:00Z",
      updated_at: "2024-07-20T15:00:00Z",
      approved_at: "2024-07-20T16:00:00Z",
    },
    "3": {
      id: "fedcba9876543210",
      project_name: "Consultoria de Segurança Cibernética",
      technician_name: "Pedro Almeida",
      service_date: "2024-07-18T10:00:00Z",
      start_time: "13:00",
      end_time: "18:00",
      status: "rejected",
      client_company: "Global Finance",
      client_contact_name: "Fernanda Lima",
      client_contact_email: "fernanda.lima@globalfinance.com",
      client_contact_phone: "(21) 91234-5678",
      activity_description:
        "Análise de vulnerabilidades na rede interna, teste de penetração em sistemas críticos, revisão de políticas de segurança. Elaboração de relatório com recomendações para melhoria da postura de segurança.",
      client_feedback:
        "O relatório não atendeu às nossas expectativas em termos de profundidade e clareza das recomendações.",
      created_at: "2024-07-17T11:00:00Z",
      updated_at: "2024-07-18T19:00:00Z",
      approved_at: "2024-07-18T20:00:00Z",
    },
  }
  return mockData[id] || null
}

const deleteServiceSheet = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
  if (id === "1234567890abcdef") {
    return { success: true, message: "Ficha de serviço excluída com sucesso!" }
  }
  return { success: false, error: "Falha ao excluir ficha de serviço." }
}

const resendApprovalEmail = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
  if (id === "1234567890abcdef") {
    return { success: true, message: "Email de aprovação reenviado com sucesso!" }
  }
  return { success: false, error: "Falha ao reenviar email." }
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Edit,
  Trash2,
  Mail,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Building2,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
} from "lucide-react"

export default function ServiceSheetDetailsPage({ params }: { params: { id: string } }) {
  const [serviceSheet, setServiceSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchServiceSheet() {
      setLoading(true) // Ensure loading is true on re-fetch
      const sheet = await getServiceSheetById(params.id)
      setServiceSheet(sheet)
      setLoading(false)
    }
    fetchServiceSheet()
  }, [params.id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteServiceSheet(params.id)
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
      const result = await resendApprovalEmail(serviceSheet.id) // Use serviceSheet.id instead of params.id for consistency
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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg text-gray-700">Carregando detalhes da ficha de serviço...</p>
      </div>
    )
  }

  if (!serviceSheet) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-lg text-red-700">Ficha de serviço não encontrada.</p>
        <Button asChild className="mt-6">
          <Link href="/service-sheets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Lista
          </Link>
        </Button>
      </div>
    )
  }

  const statusColor = {
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  }

  const getStatusIcon = () => {
    switch (serviceSheet.status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-orange-500" /> // Changed to orange for pending
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <Button asChild variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
            <Link href="/service-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Lista
            </Link>
          </Button>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            {serviceSheet.project_name}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            {getStatusIcon()}
            <Badge
              className={cn(
                "text-base font-semibold px-3 py-1",
                statusColor[serviceSheet.status as keyof typeof statusColor],
              )}
            >
              {serviceSheet.status === "pending"
                ? "Pendente"
                : serviceSheet.status === "approved"
                  ? "Aprovado"
                  : "Rejeitado"}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">ID: {serviceSheet.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          {serviceSheet.status !== "approved" && (
            <>
              <Button asChild className="px-4 py-2">
                <Link href={`/service-sheets/${serviceSheet.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resending}
                className="px-4 py-2 bg-transparent"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar Email
                  </>
                )}
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="px-4 py-2">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a ficha de serviço "
                  {serviceSheet.project_name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
              Informações do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4 text-gray-500" />
                  Técnico Responsável
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{serviceSheet.technician_name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Data do Serviço
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {format(new Date(serviceSheet.service_date), "PPP")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Horário
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {serviceSheet.start_time} - {serviceSheet.end_time}
                </p>
              </div>

              {serviceSheet.approved_at && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Aprovado Em
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {format(new Date(serviceSheet.approved_at), "PPP")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4 text-gray-500" />
                Empresa
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{serviceSheet.client_company}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4 text-gray-500" />
                Contato
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{serviceSheet.client_contact_name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4 text-gray-500" />
                Email
              </div>
              <p className="font-semibold break-all text-gray-800 dark:text-gray-200">
                {serviceSheet.client_contact_email}
              </p>
            </div>

            {serviceSheet.client_contact_phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Telefone
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{serviceSheet.client_contact_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Description */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500"></div>
            Atividades Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose max-w-none text-gray-700 dark:text-gray-300">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="leading-relaxed whitespace-pre-line m-0">{serviceSheet.activity_description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Feedback */}
      {serviceSheet.client_feedback && (
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Feedback do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <p className="text-blue-900 dark:text-blue-100 leading-relaxed whitespace-pre-line m-0">
                {serviceSheet.client_feedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline & Metadata */}
      <Card className="bg-muted/30 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative pl-6 space-y-6">
            {/* Vertical line for timeline */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

            <div className="relative flex items-start gap-3">
              <div className="absolute left-[-7px] top-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-background"></div>
              <div className="flex-1 ml-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">Ficha criada</span>
                <span className="text-muted-foreground ml-2 text-sm">
                  {format(new Date(serviceSheet.created_at), "PPP 'às' HH:mm")}
                </span>
              </div>
            </div>

            {serviceSheet.updated_at !== serviceSheet.created_at && (
              <div className="relative flex items-start gap-3">
                <div className="absolute left-[-7px] top-1.5 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background"></div>
                <div className="flex-1 ml-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Última atualização</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {format(new Date(serviceSheet.updated_at), "PPP 'às' HH:mm")}
                  </span>
                </div>
              </div>
            )}

            {serviceSheet.approved_at && (
              <div className="relative flex items-start gap-3">
                <div className="absolute left-[-7px] top-1.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                <div className="flex-1 ml-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {serviceSheet.status === "approved" ? "Aprovada pelo cliente" : "Rejeitada pelo cliente"}
                  </span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {format(new Date(serviceSheet.approved_at), "PPP 'às' HH:mm")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
