import { notFound, redirect } from "next/navigation"
import { getServiceSheetById } from "@/lib/supabase"
import { getUser, getUserProfile } from "@/lib/auth"
import ServiceSheetForm from "@/components/service-sheet-form"

export default async function EditServiceSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  // Only admins can edit service sheets, not technicians or observers
  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const serviceSheet = await getServiceSheetById(resolvedParams.id)

  if (!serviceSheet) {
    notFound()
  }

  // Only allow editing if not approved
  if (serviceSheet.status === "approved") {
    redirect(`/service-sheets/${resolvedParams.id}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar Ficha de Serviço</h1>
      <ServiceSheetForm initialData={serviceSheet} isEditing={true} />
    </div>
  )
}