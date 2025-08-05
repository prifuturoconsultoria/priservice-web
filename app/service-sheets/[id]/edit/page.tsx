import { notFound, redirect } from "next/navigation"
import { getServiceSheetById } from "@/lib/supabase"
import ServiceSheetForm from "@/components/service-sheet-form"

export default async function EditServiceSheetPage({ params }: { params: { id: string } }) {
  const serviceSheet = await getServiceSheetById(params.id)

  if (!serviceSheet) {
    notFound()
  }

  // Only allow editing if not approved
  if (serviceSheet.status === "approved") {
    redirect(`/service-sheets/${params.id}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar Ficha de Serviço</h1>
      <ServiceSheetForm initialData={serviceSheet} isEditing={true} />
    </div>
  )
}