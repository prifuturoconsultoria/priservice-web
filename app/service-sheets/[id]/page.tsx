"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { getServiceSheetById, deleteServiceSheet, resendApprovalEmail } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Eye, Edit, Trash2, Mail, ArrowLeft, Clock, Calendar, User, Building2, Phone, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react"

export default function ServiceSheetDetailsPage({ params }: { params: { id: string } }) {
  const [serviceSheet, setServiceSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchServiceSheet() {
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
      const result = await resendApprovalEmail(params.id)
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
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  if (!serviceSheet) {
    return <div className="text-center text-red-500">Ficha de serviço não encontrada.</div>
  }

  const statusColor = {
    pending: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  const getStatusIcon = () => {
    switch (serviceSheet.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2">
            <Link href="/service-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Lista
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{serviceSheet.project_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusIcon()}
            <Badge className={cn("text-sm", statusColor[serviceSheet.status as keyof typeof statusColor])}>
              {serviceSheet.status === 'pending' ? 'Pendente' : 
               serviceSheet.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
            </Badge>
            <span className="text-sm text-muted-foreground">ID: {serviceSheet.id.slice(0, 8)}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {serviceSheet.status !== "approved" && (
            <>
              <Button asChild>
                <Link href={`/service-sheets/${serviceSheet.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button 
                variant="outline"
                onClick={handleResendEmail}
                disabled={resending}
              >
                <Mail className="mr-2 h-4 w-4" />
                {resending ? "Reenviando..." : "Reenviar Email"}
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente
                  a ficha de serviço "{serviceSheet.project_name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              Informações do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Técnico Responsável
                </div>
                <p className="text-lg font-medium">{serviceSheet.technician_name}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Data do Serviço
                </div>
                <p className="text-lg font-medium">{format(new Date(serviceSheet.service_date), "PPP")}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Horário
                </div>
                <p className="text-lg font-medium">
                  {serviceSheet.start_time} - {serviceSheet.end_time}
                </p>
              </div>
              
              {serviceSheet.approved_at && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    Aprovado Em
                  </div>
                  <p className="text-lg font-medium">{format(new Date(serviceSheet.approved_at), "PPP")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Empresa
              </div>
              <p className="font-medium">{serviceSheet.client_company}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Contato
              </div>
              <p className="font-medium">{serviceSheet.client_contact_name}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="font-medium break-all">{serviceSheet.client_contact_email}</p>
            </div>
            
            {serviceSheet.client_contact_phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Telefone
                </div>
                <p className="font-medium">{serviceSheet.client_contact_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            Atividades Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="bg-slate-50 rounded-lg p-6 border">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line m-0">
                {serviceSheet.activity_description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Feedback */}
      {serviceSheet.client_feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Feedback do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <p className="text-blue-900 leading-relaxed whitespace-pre-line m-0">
                {serviceSheet.client_feedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline & Metadata */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <span className="font-medium">Ficha criada</span>
                <span className="text-muted-foreground ml-2">
                  {format(new Date(serviceSheet.created_at), "PPP 'às' HH:mm")}
                </span>
              </div>
            </div>
            
            {serviceSheet.updated_at !== serviceSheet.created_at && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div>
                  <span className="font-medium">Última atualização</span>
                  <span className="text-muted-foreground ml-2">
                    {format(new Date(serviceSheet.updated_at), "PPP 'às' HH:mm")}
                  </span>
                </div>
              </div>
            )}
            
            {serviceSheet.approved_at && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <span className="font-medium">
                    {serviceSheet.status === 'approved' ? 'Aprovada pelo cliente' : 'Rejeitada pelo cliente'}
                  </span>
                  <span className="text-muted-foreground ml-2">
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
