import { getServiceSheetByToken } from "@/lib/supabase"
import { ApprovalButtons } from "@/components/approval-buttons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default async function ApprovalPage({ params }: { params: { token: string } }) {
  const serviceSheet = await getServiceSheetByToken(params.token)

  if (!serviceSheet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-6 text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Link Inválido ou Expirado</CardTitle>
          <CardDescription className="mt-2">
            O link de aprovação da ficha de serviço é inválido ou expirou. Por favor, entre em contato com o técnico.
          </CardDescription>
        </Card>
      </div>
    )
  }

  const statusColor = {
    pending: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Aprovação de Serviço</CardTitle>
          <CardDescription>Revise os detalhes do serviço e forneça sua aprovação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border space-y-2">
            <h2 className="font-semibold text-xl">{serviceSheet.project_name}</h2>
            <p className="text-sm text-muted-foreground">Técnico: {serviceSheet.technician_name}</p>
            <p className="text-sm text-muted-foreground">Cliente: {serviceSheet.client_company}</p>
            <p className="text-sm text-muted-foreground">Data: {format(new Date(serviceSheet.service_date), "PPP")}</p>
            <p className="text-sm text-muted-foreground">
              Hora: {serviceSheet.start_time} - {serviceSheet.end_time}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status Atual:</span>
              <Badge className={cn("text-base", statusColor[serviceSheet.status as keyof typeof statusColor])}>
                {serviceSheet.status.charAt(0).toUpperCase() + serviceSheet.status.slice(1)}
              </Badge>
            </div>
            {serviceSheet.approved_at && (
              <p className="text-sm text-muted-foreground">
                Aprovado/Rejeitado Em: {format(new Date(serviceSheet.approved_at), "PPPp")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Atividades Realizadas:</h3>
            <p className="whitespace-pre-line border rounded-md p-3 bg-white">{serviceSheet.activity_description}</p>
          </div>

          {serviceSheet.client_feedback && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Seu Feedback Anterior:</h3>
              <p className="whitespace-pre-line border rounded-md p-3 bg-white">{serviceSheet.client_feedback}</p>
            </div>
          )}

          {serviceSheet.status === "pending" ? (
            <ApprovalButtons token={params.token} />
          ) : (
            <p className="text-center text-muted-foreground">Esta ficha de serviço já foi {serviceSheet.status}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
