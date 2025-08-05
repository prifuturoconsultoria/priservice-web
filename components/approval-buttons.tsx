"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { approveServiceSheet } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CheckCircle, AlertTriangle } from "lucide-react"

const feedbackSchema = z.object({
  feedback: z.string().max(500, "Feedback não pode exceder 500 caracteres").optional(),
})

type FeedbackData = z.infer<typeof feedbackSchema>

export function ApprovalButtons({ token }: { token: string }) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedAction, setCompletedAction] = useState<'approved' | 'rejected' | null>(null)
  const { toast } = useToast()
  
  const form = useForm<FeedbackData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: "",
    },
  })

  const handleApprove = async (data: FeedbackData) => {
    setIsApproving(true)
    try {
      const result = await approveServiceSheet(token, data.feedback || "", true)
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
          description: `Erro ao aprovar: ${result.error}`,
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

  const handleReject = async (data: FeedbackData) => {
    setIsRejecting(true)
    try {
      const result = await approveServiceSheet(token, data.feedback || "", false)
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
          description: `Erro ao rejeitar: ${result.error}`,
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
      <Card className="w-full bg-green-50 border-green-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-green-800">
            {completedAction === 'approved' ? 'Serviço Aprovado!' : 'Feedback Enviado!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-green-700 mb-4 text-sm md:text-base">
            Obrigado, seu feedback foi coletado. Já pode fechar essa página.
          </p>
          <Button 
            onClick={() => window.close()} 
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100 text-sm md:text-base h-10 md:h-11"
          >
            Fechar Página
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm md:text-base">Feedback do Cliente (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione feedback para o técnico..."
                  rows={3}
                  className="text-sm md:text-base"
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
            className="flex-1 text-sm md:text-base h-10 md:h-11"
          >
            {isApproving ? "Aprovando..." : "Aprovar"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                type="button"
                disabled={isApproving || isRejecting} 
                variant="outline" 
                className="flex-1 bg-transparent text-sm md:text-base h-10 md:h-11"
              >
                {isRejecting ? "Rejeitando..." : "Rejeitar"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <AlertDialogTitle>Confirmar Rejeição</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-base">
                  Tem certeza de que deseja <strong>rejeitar</strong> esta ficha de serviço? 
                  Esta ação irá notificar o técnico sobre a rejeição.
                  {form.watch("feedback") && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-sm font-medium text-orange-800">Seu feedback será incluído:</p>
                      <p className="text-sm text-orange-700 italic mt-1">"{form.watch("feedback")}"</p>
                    </div>
                  )}
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
