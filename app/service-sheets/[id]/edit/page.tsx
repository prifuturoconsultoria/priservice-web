import { notFound, redirect } from "next/navigation"
import { getServiceSheetById, getAllProjects } from "@/lib/service-sheets-api"
import { getUser, getUserProfile } from "@/lib/auth"
import ServiceSheetForm from "@/components/service-sheet-form"

export default async function EditServiceSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params

  // Parallel: auth + data fetch
  const [user, profile, sheetResponse, projects] = await Promise.all([
    getUser(),
    getUserProfile(),
    getServiceSheetById(resolvedParams.id),
    getAllProjects(),
  ])

  if (!user) redirect('/login')
  // Observers cannot edit
  if (profile?.role === 'observer') redirect('/')

  const serviceSheet = sheetResponse.data
  if (!serviceSheet) notFound()

  // Only allow editing if not approved
  if (serviceSheet.status === "approved") {
    redirect(`/service-sheets/${resolvedParams.id}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar Ficha de Serviço</h1>
      <ServiceSheetForm initialData={serviceSheet} isEditing={true} initialProjects={projects} initialUser={profile} />
    </div>
  )
}
