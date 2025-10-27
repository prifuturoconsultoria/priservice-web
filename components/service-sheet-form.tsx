"use client"

import type React from "react"

import { useTransition, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createServiceSheet, updateServiceSheet, getAllProjects, getCurrentUserProfile, getProjectHoursInfo } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Send, Save } from "lucide-react"

const formSchema = z.object({
  project_id: z.string().min(1, "Projeto é obrigatório"),
  subject: z.string().min(1, "Assunto é obrigatório").max(200, "Assunto muito longo"),
  client_contact_name: z.string().min(1, "Nome do contato é obrigatório").max(100, "Nome muito longo"),
  client_contact_email: z.string().email("Email inválido"),
  client_contact_phone: z.string().optional(),
  service_date: z.string().min(1, "Data do serviço é obrigatória"),
  start_time: z.string().min(1, "Hora de início é obrigatória"),
  end_time: z.string().min(1, "Hora de término é obrigatória"),
  activity_description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.start_time < data.end_time
  }
  return true
}, {
  message: "Hora de término deve ser posterior à hora de início",
  path: ["end_time"]
})

type FormData = z.infer<typeof formSchema>

interface Project {
  id: string
  name: string
  company: string
  client_responsible: string
  partner_responsible: string
}

interface ServiceSheetFormProps {
  initialData?: any
  isEditing?: boolean
}

export default function ServiceSheetForm({ initialData, isEditing = false }: ServiceSheetFormProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [projectHoursInfo, setProjectHoursInfo] = useState<any>(null)
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: "",
      subject: "",
      client_contact_name: "",
      client_contact_email: "",
      client_contact_phone: "",
      service_date: "",
      start_time: "",
      end_time: "",
      activity_description: "",
    },
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, userProfile] = await Promise.all([
          getAllProjects(),
          getCurrentUserProfile()
        ])
        
        setProjects(projectsData)
        setCurrentUser(userProfile)
        
        if (initialData) {
          form.reset({
            project_id: initialData.project_id || "",
            subject: initialData.subject || "",
            client_contact_name: initialData.client_contact_name || "",
            client_contact_email: initialData.client_contact_email || "",
            client_contact_phone: initialData.client_contact_phone || "",
            service_date: initialData.service_date || "",
            start_time: initialData.start_time || "",
            end_time: initialData.end_time || "",
            activity_description: initialData.activity_description || "",
          })
        } else {
          // Set default values for new service sheet
          form.reset({
            project_id: "",
            subject: "",
            client_contact_name: "",
            client_contact_email: "",
            client_contact_phone: "",
            service_date: "",
            start_time: "",
            end_time: "",
            activity_description: "",
          })
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }
    
    loadData()
  }, [initialData, form])

  // Watch for project selection changes and fetch hours info
  const selectedProjectId = form.watch("project_id")
  useEffect(() => {
    const loadProjectHours = async () => {
      if (selectedProjectId) {
        const hoursInfo = await getProjectHoursInfo(selectedProjectId)
        setProjectHoursInfo(hoursInfo)
      } else {
        setProjectHoursInfo(null)
      }
    }
    loadProjectHours()
  }, [selectedProjectId])

  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  if (isLoadingData) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-4 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded"></div>
          <div className="h-32 bg-muted animate-pulse rounded"></div>
          <div className="h-32 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      let result
      if (isEditing && initialData) {
        result = await updateServiceSheet(initialData.id, data)
      } else {
        result = await createServiceSheet(data)
      }
      
      if (result.success) {
        if (isEditing) {
          toast({
            title: "Sucesso!",
            description: "Ficha de serviço atualizada com sucesso!",
          })
          router.push(`/service-sheets/${initialData.id}`)
        } else {
          toast({
            title: "Sucesso!",
            description: "Ficha de serviço criada! E-mail de aprovação simulado para o cliente.",
          })
          router.push("/service-sheets")
        }
      } else {
        toast({
          title: "Erro",
          description: `Erro ao ${isEditing ? 'atualizar' : 'criar'} ficha de serviço: ${result.error}`,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Editar Ficha de Serviço' : 'Nova Ficha de Serviço'}</h1>
        <p className="text-muted-foreground">{isEditing ? 'Atualize os detalhes do serviço realizado' : 'Preencha as informações do serviço prestado'}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Informações do Projeto
              </CardTitle>
              <CardDescription>Selecione o projeto para esta ficha de serviço</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Projeto *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} - {project.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {projectHoursInfo && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">Horas do Projeto:</span>
                      <span className="ml-2 text-muted-foreground">
                        {projectHoursInfo.usedHours.toFixed(2)}h / {projectHoursInfo.totalHours.toFixed(2)}h utilizadas
                      </span>
                    </div>
                    <div className={`font-semibold ${projectHoursInfo.availableHours > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {projectHoursInfo.availableHours > 0 ? (
                        <span>Disponível: {projectHoursInfo.availableHours.toFixed(2)}h</span>
                      ) : (
                        <span>Sem horas disponíveis</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Assunto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Manutenção preventiva dos servidores" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Informações do Cliente
              </CardTitle>
              <CardDescription>Dados de contato e empresa do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="client_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Pessoa de Contato *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="client_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Telefone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="841211212" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                Detalhes do Serviço
              </CardTitle>
              <CardDescription>Horários e descrição das atividades realizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Data do Serviço *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Término *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="activity_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Descrição das Atividades *</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Descreva detalhadamente as atividades realizadas, problemas encontrados, soluções implementadas..."
                        className="min-h-[250px]"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Use a barra de ferramentas para formatar o texto
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1 h-11" disabled={isPending}>
                  {isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                      {isEditing ? "Atualizar Ficha" : "Enviar Ficha"}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="sm:w-32 h-11"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              </div>
              {!isEditing && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Após enviar, o cliente receberá um email para aprovação da ficha de serviço
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
