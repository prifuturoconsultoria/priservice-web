"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { approveServiceSheet } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

const feedbackSchema = z.object({
  feedback: z.string().max(500, "Feedback não pode exceder 500 caracteres").optional(),
})

type FeedbackData = z.infer<typeof feedbackSchema>

export function ApprovalButtons({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  
  const form = useForm<FeedbackData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: "",
    },
  })

  const handleApprove = (data: FeedbackData) => {
    startTransition(async () => {
      const result = await approveServiceSheet(token, data.feedback || "", true)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Ficha de serviço aprovada!",
        })
        router.push("/service-sheets")
      } else {
        toast({
          title: "Erro",
          description: `Erro ao aprovar: ${result.error}`,
          variant: "destructive",
        })
      }
    })
  }

  const handleReject = (data: FeedbackData) => {
    startTransition(async () => {
      const result = await approveServiceSheet(token, data.feedback || "", false)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Ficha de serviço rejeitada!",
        })
        router.push("/service-sheets")
      } else {
        toast({
          title: "Erro",
          description: `Erro ao rejeitar: ${result.error}`,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback do Cliente (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione feedback para o técnico..."
                  rows={3}
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
            disabled={isPending} 
            className="flex-1"
          >
            {isPending ? "Aprovando..." : "Aprovar"}
          </Button>
          <Button 
            type="button"
            onClick={form.handleSubmit(handleReject)} 
            disabled={isPending} 
            variant="outline" 
            className="flex-1 bg-transparent"
          >
            {isPending ? "Rejeitando..." : "Rejeitar"}
          </Button>
        </div>
      </div>
    </Form>
  )
}
