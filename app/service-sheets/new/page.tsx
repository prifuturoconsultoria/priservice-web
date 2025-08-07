import ServiceSheetForm from "@/components/service-sheet-form"
import { getUser, getUserProfile } from "@/lib/auth"
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

  return (
    <div className="flex flex-col gap-4">
      <ServiceSheetForm />
    </div>
  )
}
