"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { deleteServiceSheet, resendApprovalEmail } from "@/lib/service-sheets-api"
import { useServiceSheet, useProfile } from "@/lib/hooks/use-data"
import type { ServiceSheet } from "@/types/service-sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Eye, Edit, Trash2, Mail, ArrowLeft, Clock, Calendar, User, Building2, Phone, CheckCircle, XCircle, AlertCircle, MessageSquare, MoreVertical, Type } from "lucide-react"
import { PDFGenerator } from "@/components/pdf-generator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ServiceSheetDetailsProps {
  initialServiceSheet?: ServiceSheet | null
  initialProfile?: any
}

export function ServiceSheetDetails({ initialServiceSheet, initialProfile }: ServiceSheetDetailsProps) {
  const params = useParams()
  const id = params.id as string
  const { data: swrSheet, isLoading } = useServiceSheet(id)
  const { data: swrProfile } = useProfile()
  const serviceSheet = swrSheet || initialServiceSheet
  const userProfile = swrProfile || initialProfile
  const [deleting, setDeleting] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!serviceSheet) return
    setDeleting(true)
    try {
      const result = await deleteServiceSheet(serviceSheet.id)
      if (result.success) {
        toast({ title: "Sucesso!", description: "Ficha de serviço excluída com sucesso!" })
        router.push("/service-sheets")
      } else {
        toast({ title: "Erro", description: `Erro ao excluir: ${result.error}`, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao excluir ficha de serviço", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleResendEmail = async () => {
    if (!serviceSheet) return
    setResending(true)
    try {
      const result = await resendApprovalEmail(serviceSheet.id)
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message || "Email reenviado com sucesso!" })
      } else {
        toast({ title: "Erro", description: result.error || "Erro ao reenviar email", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao reenviar email", variant: "destructive" })
    } finally {
      setResending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-4 max-w-7xl space-y-6">
          <Skeleton className="h-8 w-40 rounded-md" />
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm space-y-4">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
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
      color: "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100",
      icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
      label: "Pendente"
    },
    approved: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100",
      icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
      label: "Aprovado"
    },
    rejected: {
      color: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100",
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      label: "Rejeitado"
    }
  }

  const currentStatus = statusConfig[serviceSheet.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Breadcrumb & Back Navigation */}
        <nav className="mb-4">
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/service-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Fichas de Serviço
            </Link>
          </Button>
        </nav>

        {/* Header Section */}
        <div className="mb-6">
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
                <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  {serviceSheet.subject || serviceSheet.project?.name || 'N/A'}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {serviceSheet.project?.name || 'Projeto não especificado'} • Ficha de serviço técnico
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

              {/* Show edit/email actions for admin and technician */}
              {serviceSheet.status !== "approved" && userProfile?.role !== 'observer' && (
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
                    {serviceSheet.status !== "approved" && userProfile?.role !== 'observer' && (
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

              {/* Delete Button - admin and technician */}
              {userProfile?.role !== 'observer' && (
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
                      Esta ação não pode ser desfeita. A ficha de serviço "{serviceSheet.project?.name || 'N/A'}"
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
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="xl:col-span-2 space-y-6">
            <Accordion type="multiple" defaultValue={["project", "hours", "activities", "feedback"]} className="space-y-4">
              {/* Project Information */}
              <AccordionItem value="project" className="border rounded-xl px-4 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-shadow duration-200">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm"></div>
                    Informações do Projeto
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pt-2 px-4">
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
                        <p className="text-base md:text-lg font-semibold text-foreground">{serviceSheet.createdBy?.fullName || 'N/A'}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          <Clock className="h-3 w-3" />
                          Total de Horas
                        </div>
                        <p className="text-base md:text-lg font-semibold text-foreground">
                          {serviceSheet.totalHours ? `${serviceSheet.totalHours}h` : 'N/A'}
                        </p>
                      </div>

                      {serviceSheet.approvedAt && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <CheckCircle className="h-3 w-3" />
                            Data de Aprovação
                          </div>
                          <p className="text-base md:text-lg font-semibold text-foreground">
                            {format(new Date(serviceSheet.approvedAt), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Service Lines Breakdown */}
              {serviceSheet.lines && serviceSheet.lines.length > 0 && (
                <AccordionItem value="hours" className="border rounded-xl px-4 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-shadow duration-200">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                      <div className="h-2 w-2 rounded-full bg-purple-500 shadow-sm"></div>
                      Detalhamento de Horas
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="pt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Data</TableHead>
                            <TableHead className="text-xs">Início</TableHead>
                            <TableHead className="text-xs">Término</TableHead>
                            <TableHead className="text-xs">Descrição</TableHead>
                            <TableHead className="text-right text-xs">Horas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceSheet.lines.map((line: any) => (
                            <TableRow key={line.id}>
                              <TableCell className="font-medium text-xs md:text-sm">
                                {format(new Date(line.serviceDate), "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{line.startTime?.substring(0, 5)}</TableCell>
                              <TableCell className="font-mono text-xs">{line.endTime?.substring(0, 5)}</TableCell>
                              <TableCell className="text-xs md:text-sm max-w-xs">
                                {line.description ? (
                                  <div className="text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: line.description }} />
                                ) : (
                                  <span className="text-muted-foreground italic">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-xs md:text-sm">
                                {line.hours}h
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={4} className="text-right text-xs md:text-sm">Total</TableCell>
                            <TableCell className="text-right text-base md:text-lg">
                              {serviceSheet.totalHours}h
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Activity Description */}
              <AccordionItem value="activities" className="border rounded-xl px-4 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-shadow duration-200">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                    <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm"></div>
                    Atividades Realizadas
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pt-2 px-4">
                    <div className="prose prose-slate max-w-none">
                      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 md:p-6 border border-slate-200 shadow-inner">
                        <div
                          className="text-slate-800 leading-relaxed text-xs md:text-sm prose prose-sm max-w-none [&>*]:m-0 [&>*:not(:last-child)]:mb-4 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-4 [&>ol]:ml-4 [&>blockquote]:border-l-4 [&>blockquote]:border-slate-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>p]:leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: serviceSheet.activityDescription }}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Client Feedback */}
              {serviceSheet.clientFeedback && (
                <AccordionItem value="feedback" className="border rounded-xl px-4 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-shadow duration-200">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      Feedback do Cliente
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="pt-2 px-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 md:p-6 border border-emerald-200 shadow-inner">
                        <p className="text-emerald-900 leading-relaxed whitespace-pre-line text-sm md:text-base m-0">
                          {serviceSheet.clientFeedback}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>

          {/* Right Column - Sidebar Information */}
          <div className="space-y-6">
            <Accordion type="multiple" defaultValue={["client", "timeline"]} className="space-y-4">
              {/* Client Information */}
              <AccordionItem value="client" className="border rounded-xl px-4 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-shadow duration-200">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm"></div>
                    Informações do Cliente
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pt-2 px-2 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Building2 className="h-3 w-3" />
                        Empresa
                      </div>
                      <p className="font-semibold text-sm md:text-base text-foreground break-words">
                        {serviceSheet.project?.company || 'N/A'}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <User className="h-3 w-3" />
                        Pessoa de Contato
                      </div>
                      <p className="font-semibold text-sm md:text-base text-foreground">
                        {serviceSheet.clientContactName}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Mail className="h-3 w-3" />
                        Email de Contato
                      </div>
                      <p className="font-medium text-xs md:text-sm text-foreground break-all bg-muted/50 px-2 py-1 rounded-lg">
                        {serviceSheet.clientContactEmail}
                      </p>
                    </div>

                    {serviceSheet.clientContactPhone && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <Phone className="h-3 w-3" />
                            Telefone
                          </div>
                          <p className="font-medium text-xs md:text-sm text-foreground bg-muted/50 px-2 py-1 rounded-lg">
                            {serviceSheet.clientContactPhone}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Timeline & Metadata */}
              <AccordionItem value="timeline" className="border rounded-lg px-4 bg-gradient-to-br from-muted/20 to-muted/40 backdrop-blur">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                    <Clock className="h-4 w-4 text-slate-600" />
                    Histórico da Ficha
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pt-2 px-2">
                    <div className="relative space-y-6">
                      {/* Connecting line */}
                      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border"></div>

                      <div className="flex items-start gap-4 relative">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shadow-sm ring-4 ring-blue-50 z-10 shrink-0"></div>
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-sm text-foreground">Ficha criada</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(serviceSheet.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      </div>

                      {serviceSheet.updatedAt !== serviceSheet.createdAt && (
                        <div className="flex items-start gap-4 relative">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shadow-sm ring-4 ring-amber-50 z-10 shrink-0"></div>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-sm text-foreground">Última atualização</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(serviceSheet.updatedAt), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                          </div>
                        </div>
                      )}

                      {(serviceSheet.status === 'approved' || serviceSheet.status === 'rejected') && (
                        <div className="flex items-start gap-4 relative">
                          <div className={cn(
                            "w-3 h-3 rounded-full mt-1 shadow-sm z-10 shrink-0",
                            serviceSheet.status === 'approved' ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-red-500 ring-4 ring-red-50'
                          )}></div>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-sm text-foreground">
                              {serviceSheet.status === 'approved' ? 'Aprovada pelo cliente' : 'Rejeitada pelo cliente'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(serviceSheet.approvedAt || serviceSheet.updatedAt), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}
