import { getUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { ServiceSheetDetails } from "./service-sheet-details"

export default async function ServiceSheetDetailsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return <ServiceSheetDetails />
}
