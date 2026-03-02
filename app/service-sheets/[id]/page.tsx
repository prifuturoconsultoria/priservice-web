import { getServiceSheetById } from "@/lib/service-sheets-api"
import { getUser, getUserProfile } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { ServiceSheetDetails } from "./service-sheet-details"

export default async function ServiceSheetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params

  // Parallel: auth + data fetch
  const [user, profile, sheetResult] = await Promise.all([
    getUser(),
    getUserProfile(),
    getServiceSheetById(resolvedParams.id),
  ])

  if (!user) redirect('/login')

  const serviceSheet = sheetResult.success ? sheetResult.data : null

  return (
    <ServiceSheetDetails
      serviceSheet={serviceSheet}
      userProfile={profile}
    />
  )
}
