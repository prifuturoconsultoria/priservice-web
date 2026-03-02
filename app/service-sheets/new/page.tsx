import ServiceSheetForm from "@/components/service-sheet-form"
import { getUser, getUserProfile } from "@/lib/auth"
import { getAllProjects } from "@/lib/service-sheets-api"
import { redirect } from "next/navigation"

export default async function NewServiceSheetPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  if (profile?.role === 'observer') {
    redirect('/')
  }

  // Fetch projects server-side to avoid client-side waterfall and skeleton flash
  const projects = await getAllProjects()

  return (
    <div className="flex flex-col gap-4">
      <ServiceSheetForm initialProjects={projects} initialUser={profile} />
    </div>
  )
}
