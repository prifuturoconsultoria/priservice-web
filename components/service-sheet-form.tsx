"use client"

import type React from "react"

import { useTransition, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createServiceSheet, updateServiceSheet, getCurrentUserProfile, getAllProjects } from "@/lib/service-sheets-api"
import type { CreateServiceSheetDto } from "@/types/service-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Send, Save, X, CheckCircle2, Circle, RotateCcw, ChevronsUpDown, Check, Loader2, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

// Schema for individual service line
const lineSchema = z.object({
  serviceDate: z.string().min(1, "A data é obrigatória"),
  startTime: z.string().min(1, "A hora de início é obrigatória"),
  endTime: z.string().min(1, "A hora de término é obrigatória"),
  description: z.string().optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: "A hora de término deve ser posterior à hora de início",
  path: ["endTime"]
})

// Main form schema with multi-line support
const formSchema = z.object({
  projectId: z.string().min(1, "O projecto é obrigatório"),
  subject: z.string().min(1, "O assunto é obrigatório").max(200, "Assunto demasiado longo"),
  clientContactName: z.string().min(1, "O nome do contacto é obrigatório").max(100, "Nome demasiado longo"),
  clientContactEmail: z.string().email("Endereço de email inválido"),
  clientContactPhone: z.string().optional(),
  ccEmails: z.array(z.string().email("Endereço de email inválido")).optional(),
  lines: z.array(lineSchema).min(1, "Pelo menos um dia de trabalho é obrigatório").max(30, "Máximo de 30 dias permitido"),
  activityDescription: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
})

type FormData = z.infer<typeof formSchema>

interface Project {
  id: string
  name: string
  company: string
  client_responsible: string
  partner_responsible: string
  total_hours?: number
  used_hours?: number
  totalHours?: number
  usedHours?: number
  availableHours?: number
}

interface ServiceSheetFormProps {
  initialData?: any
  isEditing?: boolean
  initialProjects?: Project[]
  initialUser?: any
}

export default function ServiceSheetForm({ initialData, isEditing = false, initialProjects, initialUser }: ServiceSheetFormProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects ?? [])
  const [currentUser, setCurrentUser] = useState<any>(initialUser ?? null)
  const [isLoadingData, setIsLoadingData] = useState(!initialProjects)
  const [projectComboOpen, setProjectComboOpen] = useState(false)
  const [projectSearch, setProjectSearch] = useState("")
  const [projectHoursInfo, setProjectHoursInfo] = useState<any>(null)
  const [openAccordions, setOpenAccordions] = useState<string[]>(["project"])
  const [hasAutoOpened, setHasAutoOpened] = useState<{ [key: string]: boolean }>({
    client: false,
    days: false,
    activities: false
  })

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      subject: "",
      clientContactName: "",
      clientContactEmail: "",
      clientContactPhone: "",
      ccEmails: [],
      lines: [
        {
          serviceDate: getTodayDate(),
          startTime: "",
          endTime: "",
          description: "",
        }
      ],
      activityDescription: "",
    },
  })

  // Calculate total hours from all lines
  const calculateTotalHours = (lines: any[]): number => {
    return lines.reduce((total, line) => {
      if (line.startTime && line.endTime) {
        const start = new Date(`2000-01-01T${line.startTime}`)
        const end = new Date(`2000-01-01T${line.endTime}`)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return total + (hours > 0 ? hours : 0)
      }
      return total
    }, 0)
  }

  // Watch lines for real-time hour calculation
  const watchedLines = form.watch("lines")
  const totalHours = calculateTotalHours(watchedLines || [])

  // Watch form fields for progressive accordion opening
  const watchedProjectId = form.watch("projectId")
  const watchedSubject = form.watch("subject")
  const watchedClientName = form.watch("clientContactName")
  const watchedClientEmail = form.watch("clientContactEmail")
  const watchedActivityDescription = form.watch("activityDescription")

  // Check section completion status
  const isProjectComplete = watchedProjectId && watchedSubject
  const isClientComplete = watchedClientName && watchedClientEmail && watchedClientEmail.includes('@')
  const isDaysComplete = watchedLines && watchedLines.length > 0 &&
    watchedLines[0].serviceDate &&
    watchedLines[0].startTime &&
    watchedLines[0].endTime &&
    watchedLines[0].startTime < watchedLines[0].endTime
  const isActivitiesComplete = watchedActivityDescription && watchedActivityDescription.length >= 10

  // Progressive accordion opening logic (only auto-opens ONCE per section)
  useEffect(() => {
    // Auto-open client section when project is complete (only once)
    if (isProjectComplete && !hasAutoOpened.client && !openAccordions.includes("client")) {
      setOpenAccordions(prev => [...prev, "client"])
      setHasAutoOpened(prev => ({ ...prev, client: true }))
      // Smooth scroll to next section after a brief delay
      setTimeout(() => {
        document.getElementById("client-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 100)
    }

    // Auto-open days section when client is complete (only once)
    if (isClientComplete && !hasAutoOpened.days && !openAccordions.includes("days")) {
      setOpenAccordions(prev => [...prev, "days"])
      setHasAutoOpened(prev => ({ ...prev, days: true }))
      setTimeout(() => {
        document.getElementById("days-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 100)
    }

    // Auto-open activities section when days is complete (only once)
    if (isDaysComplete && !hasAutoOpened.activities && !openAccordions.includes("activities")) {
      setOpenAccordions(prev => [...prev, "activities"])
      setHasAutoOpened(prev => ({ ...prev, activities: true }))
      setTimeout(() => {
        document.getElementById("activities-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 100)
    }
  }, [watchedProjectId, watchedSubject, watchedClientName, watchedClientEmail, watchedLines, watchedActivityDescription, isProjectComplete, isClientComplete, isDaysComplete, hasAutoOpened, openAccordions])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Skip API calls if data was already provided via props (server-fetched)
        if (!initialProjects) {
          const [projectsData, userProfile] = await Promise.all([
            getAllProjects(),
            getCurrentUserProfile()
          ])

          if (Array.isArray(projectsData)) {
            setProjects(projectsData)
          } else {
            setProjects([])
          }
          setCurrentUser(userProfile)
        }

        if (initialData) {
          // Transform API data to form format if editing
          form.reset({
            projectId: initialData.projectId || initialData.project_id || "",
            subject: initialData.subject || "",
            clientContactName: initialData.clientContactName || initialData.client_contact_name || "",
            clientContactEmail: initialData.clientContactEmail || initialData.client_contact_email || "",
            clientContactPhone: initialData.clientContactPhone || initialData.client_contact_phone || "",
            ccEmails: initialData.ccEmails || [],
            lines: initialData.lines && initialData.lines.length > 0
              ? initialData.lines.map((line: any) => ({
                  serviceDate: line.serviceDate || line.service_date || "",
                  startTime: line.startTime?.substring(0, 5) || line.start_time?.substring(0, 5) || "",
                  endTime: line.endTime?.substring(0, 5) || line.end_time?.substring(0, 5) || "",
                  description: line.description || "",
                }))
              : [{ serviceDate: initialData.service_date || "", startTime: initialData.start_time?.substring(0, 5) || "", endTime: initialData.end_time?.substring(0, 5) || "", description: "" }],
            activityDescription: initialData.activityDescription || initialData.activity_description || "",
          })

          // Open all accordions in edit mode
          setOpenAccordions(["project", "client", "days", "activities"])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [initialData, form])

  // Watch for project selection changes and extract hours info from existing data
  const selectedProjectId = form.watch("projectId")
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      // Find the selected project in the already loaded projects array
      const selectedProject = projects.find(p => p.id === selectedProjectId)

      if (selectedProject) {
        // Handle both snake_case (from server) and camelCase (from API) field names
        const totalHours = selectedProject.totalHours ?? selectedProject.total_hours ?? 0
        const usedHours = selectedProject.usedHours ?? selectedProject.used_hours ?? 0
        const availableHours = selectedProject.availableHours ?? (totalHours - usedHours)
        setProjectHoursInfo({
          totalHours,
          usedHours,
          availableHours,
          projectName: selectedProject.name || ''
        })
      } else {
        setProjectHoursInfo(null)
      }
    } else {
      setProjectHoursInfo(null)
    }
  }, [selectedProjectId, projects])

  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      // Transform form data to API format
      const apiData: CreateServiceSheetDto = {
        projectId: data.projectId,
        subject: data.subject,
        clientContactName: data.clientContactName,
        clientContactEmail: data.clientContactEmail,
        clientContactPhone: data.clientContactPhone || undefined,
        ccEmails: data.ccEmails && data.ccEmails.length > 0 ? data.ccEmails.filter(e => e.trim()) : undefined,
        activityDescription: data.activityDescription,
        lines: data.lines.map((line, index) => ({
          lineNumber: index + 1,
          serviceDate: line.serviceDate,
          startTime: line.startTime, // HH:mm format (no seconds)
          endTime: line.endTime, // HH:mm format (no seconds)
          description: line.description || undefined,
        })),
      }

      let result
      if (isEditing && initialData) {
        result = await updateServiceSheet(initialData.id, apiData)
      } else {
        result = await createServiceSheet(apiData)
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
            description: "Ficha de serviço criada! Email de aprovação enviado ao cliente.",
          })
          router.push("/service-sheets")
        }
      } else {
        toast({
          title: "Erro",
          description: result.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} ficha de serviço`,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{isEditing ? 'Editar Ficha de Serviço' : 'Nova Ficha de Serviço'}</h1>
        <span className="text-xs text-muted-foreground border rounded-full px-2.5 py-0.5">{isEditing ? 'Edição' : 'Novo'}</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion
            type="multiple"
            value={openAccordions}
            onValueChange={setOpenAccordions}
            className="space-y-4"
          >
            {/* Project Information */}
            <AccordionItem value="project" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold">
                  {isProjectComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>Informações do Projecto</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-6 pt-2">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => {
                  const filteredProjects = projects.filter(p =>
                    `${p.name} ${p.company}`.toLowerCase().includes(projectSearch.toLowerCase())
                  )
                  const selectedProject = projects.find(p => p.id === field.value)

                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Projecto *</FormLabel>
                      <FormControl>
                        <Popover open={projectComboOpen} onOpenChange={setProjectComboOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={projectComboOpen}
                              className={cn(
                                "w-full justify-between font-normal h-10 text-left border-input bg-background shadow-sm hover:bg-accent/50 transition-colors",
                                !selectedProject && !isLoadingData && "text-muted-foreground"
                              )}
                              disabled={isLoadingData}
                            >
                              {isLoadingData ? (
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  A carregar projectos...
                                </span>
                              ) : selectedProject ? (
                                <span className="flex items-center gap-2 truncate">
                                  <FolderOpen className="h-4 w-4 shrink-0 text-blue-600" />
                                  <span className="truncate font-medium">{selectedProject.company}</span>
                                  <span className="text-muted-foreground text-xs truncate hidden sm:inline">· {selectedProject.name}</span>
                                </span>
                              ) : (
                                "Seleccione um projecto"
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-lg border" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Pesquisar projecto..."
                                value={projectSearch}
                                onValueChange={setProjectSearch}
                              />
                              <CommandList className="max-h-[250px]">
                                {filteredProjects.length === 0 ? (
                                  <CommandEmpty className="py-8 text-center">
                                    <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">Nenhum projecto encontrado.</p>
                                  </CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {filteredProjects.map((project) => {
                                      const isSelected = field.value === project.id
                                      return (
                                        <CommandItem
                                          key={project.id}
                                          value={project.id}
                                          onSelect={() => {
                                            field.onChange(project.id)
                                            setProjectComboOpen(false)
                                            setProjectSearch("")
                                          }}
                                          className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                                            isSelected && "bg-blue-50/80 text-blue-900"
                                          )}
                                        >
                                          <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                                            isSelected
                                              ? "bg-blue-600 text-white"
                                              : "bg-muted text-muted-foreground"
                                          )}>
                                            {project.company.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex flex-col min-w-0 flex-1">
                                            <span className={cn("text-sm truncate", isSelected ? "font-semibold" : "font-medium")}>{project.company}</span>
                                            <span className="text-xs text-muted-foreground truncate">{project.name}</span>
                                          </div>
                                          {isSelected && (
                                            <Check className="h-4 w-4 shrink-0 text-blue-600" />
                                          )}
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {projectHoursInfo && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">Horas do Projecto:</span>
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Client Information */}
            <AccordionItem value="client" className="border rounded-lg px-4 bg-card" id="client-section">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold">
                  {isClientComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>Informações do Cliente</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="clientContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Pessoa de Contacto Principal *</FormLabel>
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
                      name="clientContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email Principal *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contacto@empresa.co.mz" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Este email poderá aprovar a ficha</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Telefone/Telemóvel</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="84 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* CC Emails merged here */}
                  <div className="pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="ccEmails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Emails em Cópia (CC) - Opcional</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {field.value?.map((email, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                      const newEmails = [...(field.value || [])]
                                      newEmails[index] = e.target.value
                                      field.onChange(newEmails)
                                    }}
                                    placeholder="email@exemplo.co.mz"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newEmails = field.value?.filter((_, i) => i !== index)
                                      field.onChange(newEmails)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  field.onChange([...(field.value || []), ""])
                                }}
                              >
                                + Adicionar Email CC
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-2">
                            Pessoas em CC também poderão aprovar a ficha
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Service Days (Multi-line) */}
            <AccordionItem value="days" className="border rounded-lg px-4 bg-card" id="days-section">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold">
                  {isDaysComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>Dias de Trabalho</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4 pt-2">
                  {form.watch("lines")?.map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Dia {index + 1}</span>
                        {form.watch("lines")?.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentLines = form.getValues("lines")
                              form.setValue("lines", currentLines.filter((_, i) => i !== index))
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remover
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.serviceDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Data *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`lines.${index}.startTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Início *</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`lines.${index}.endTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Término *</FormLabel>
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
                        name={`lines.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Descrição (opcional)</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                placeholder="Breve descrição das actividades realizadas neste dia..."
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const currentLines = form.getValues("lines") || []
                      form.setValue("lines", [
                        ...currentLines,
                        { serviceDate: "", startTime: "", endTime: "", description: "" }
                      ])
                    }}
                    className="w-full"
                  >
                    + Adicionar Dia
                  </Button>

                  {/* Total Hours Display */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-base text-blue-900">Total de Horas:</span>
                      <span className="text-2xl font-bold text-blue-700">
                        {totalHours.toFixed(2)}h
                      </span>
                    </div>
                    {projectHoursInfo && totalHours > projectHoursInfo.availableHours && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ Atenção: O total de horas excede as horas disponíveis do projecto
                      </p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Activity Description */}
            <AccordionItem value="activities" className="border rounded-lg px-4 bg-card" id="activities-section">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold">
                  {isActivitiesComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>Descrição das Actividades</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="pt-2">
                  <FormField
                    control={form.control}
                    name="activityDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Descrição *</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Descreva detalhadamente as actividades realizadas, problemas encontrados, soluções implementadas..."
                            className="min-h-[250px]"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Utilize a barra de ferramentas para formatar o texto
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Actions */}
          <Card className="border-2">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                {/* Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  {/* Left side - Clear button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:w-auto h-11 border-dashed"
                    onClick={() => {
                      if (confirm('Tem a certeza que deseja limpar todos os campos? Esta acção não pode ser desfeita.')) {
                        form.reset({
                          projectId: "",
                          subject: "",
                          clientContactName: "",
                          clientContactEmail: "",
                          clientContactPhone: "",
                          ccEmails: [],
                          lines: [{
                            serviceDate: getTodayDate(),
                            startTime: "",
                            endTime: "",
                            description: "",
                          }],
                          activityDescription: "",
                        })
                        setProjectHoursInfo(null)
                        setOpenAccordions(["project"])
                        setHasAutoOpened({
                          client: false,
                          days: false,
                          activities: false
                        })
                        toast({
                          title: "Campos limpos",
                          description: "Todos os campos foram limpos com sucesso",
                        })
                      }
                    }}
                    disabled={isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpar Campos
                  </Button>

                  {/* Right side - Primary actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:w-32 h-11"
                      onClick={() => router.back()}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="sm:w-56 h-12 text-base font-semibold"
                    >
                      {isPending ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          A guardar...
                        </>
                      ) : (
                        <>
                          {isEditing ? <Save className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                          {isEditing ? "Actualizar Ficha" : "Enviar Ficha"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Help text */}
                {!isEditing && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-blue-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Após enviar, o cliente receberá um email para aprovação da ficha de serviço
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
