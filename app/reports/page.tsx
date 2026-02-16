import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllServiceSheets } from "@/lib/service-sheets-api"
import { getUser, getUserProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  const result = await getAllServiceSheets()
  const serviceSheets = result.success ? result.data || [] : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      <ReportsClient serviceSheets={serviceSheets} />
    </div>
  )
}
