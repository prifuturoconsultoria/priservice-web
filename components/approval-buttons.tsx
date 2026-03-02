"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { approveServiceSheet } from "@/lib/service-sheets-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const approvalSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  rejectionReason: z.string().max(500, "Motivo não pode exceder 500 caracteres").optional(),
})

type ApprovalFormData = z.infer<typeof approvalSchema>

export function ApprovalButtons({ token }: { token: string }) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedAction, setCompletedAction] = useState<'approved' | 'rejected' | null>(null)
  const { toast } = useToast()

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      email: "",
      rejectionReason: "",
    },
  })

  const handleApprove = async (data: ApprovalFormData) => {
    setIsApproving(true)
    try {
      const result = await approveServiceSheet(token, data.email, true)
      if (result.success) {
        setIsCompleted(true)
        setCompletedAction('approved')
        toast({
          title: "Sucesso!",
          description: "Ficha de serviço aprovada!",
        })
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao aprovar",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao aprovar",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async (data: ApprovalFormData) => {
    setIsRejecting(true)
    try {
      const result = await approveServiceSheet(token, data.email, false, data.rejectionReason)
      if (result.success) {
        setIsCompleted(true)
        setCompletedAction('rejected')
        toast({
          title: "Sucesso!",
          description: "Ficha de serviço rejeitada!",
        })
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao rejeitar",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao rejeitar",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          {completedAction === 'approved' ? (
            <CheckCircle className="h-10 w-10 text-green-600" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {completedAction === 'approved' ? 'Serviço Aprovado!' : 'Serviço Rejeitado'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Obrigado. Já pode fechar essa página.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Seu Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Confirme o seu email..."
                  className="text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rejectionReason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Comentário (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione um comentário..."
                  rows={3}
                  className="text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            onClick={form.handleSubmit(handleApprove)}
            disabled={isApproving || isRejecting}
            className="flex-1 text-sm h-10"
          >
            {isApproving ? "Aprovando..." : "Aprovar"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={isApproving || isRejecting}
                variant="outline"
                className="flex-1 text-sm h-10"
              >
                {isRejecting ? "Rejeitando..." : "Rejeitar"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <AlertDialogTitle>Confirmar Rejeição</AlertDialogTitle>
                </div>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      Tem certeza de que deseja rejeitar esta ficha de serviço?
                      O técnico será notificado.
                    </p>
                    {form.watch("rejectionReason") && (
                      <div className="p-3 bg-gray-50 border rounded-md">
                        <p className="text-xs font-medium text-gray-600">Seu comentário:</p>
                        <p className="text-sm text-gray-800 italic mt-1">&ldquo;{form.watch("rejectionReason")}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={form.handleSubmit(handleReject)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isRejecting}
                >
                  {isRejecting ? "Rejeitando..." : "Confirmar Rejeição"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Form>
  )
}
