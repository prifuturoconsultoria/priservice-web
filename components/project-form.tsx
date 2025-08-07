"use client"

import type React from "react"

import { useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createProject, updateProject } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Send, Save } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório").max(100, "Nome muito longo"),
  company: z.string().min(1, "Empresa é obrigatória").max(100, "Nome muito longo"),
  client_responsible: z.string().min(1, "Responsável cliente é obrigatório").max(100, "Nome muito longo"),
  partner_responsible: z.string().min(1, "Responsável parceiro é obrigatório").max(100, "Nome muito longo"),
})

type FormData = z.infer<typeof formSchema>

interface ProjectFormProps {
  initialData?: any
  isEditing?: boolean
}

export default function ProjectForm({ initialData, isEditing = false }: ProjectFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      client_responsible: "",
      partner_responsible: "",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        company: initialData.company || "",
        client_responsible: initialData.client_responsible || "",
        partner_responsible: initialData.partner_responsible || "",
      })
    }
  }, [initialData, form])
  
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      let result
      if (isEditing && initialData) {
        result = await updateProject(initialData.id, data)
      } else {
        result = await createProject(data)
      }
      
      if (result.success) {
        if (isEditing) {
          toast({
            title: "Sucesso!",
            description: "Projeto atualizado com sucesso!",
          })
          router.push(`/projects/${initialData.id}`)
        } else {
          toast({
            title: "Sucesso!",
            description: "Projeto criado com sucesso!",
          })
          router.push("/projects")
        }
      } else {
        toast({
          title: "Erro",
          description: `Erro ao ${isEditing ? 'atualizar' : 'criar'} projeto: ${result.error}`,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Editar Projeto' : 'Novo Projeto'}</h1>
        <p className="text-muted-foreground">{isEditing ? 'Atualize os detalhes do projeto' : 'Preencha as informações do projeto'}</p>
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
              <CardDescription>Dados básicos sobre o projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nome do Projeto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sistema de Gestão XYZ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Responsible Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Responsáveis
              </CardTitle>
              <CardDescription>Definir os responsáveis pelo projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Responsável Cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável no cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partner_responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Responsável Parceiro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável parceiro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                      {isEditing ? "Atualizar Projeto" : "Criar Projeto"}
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
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}