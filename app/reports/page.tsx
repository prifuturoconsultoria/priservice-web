"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllServiceSheets } from "@/lib/supabase"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default async function ReportsPage() {
  const serviceSheets = await getAllServiceSheets()

  const generateCsv = (data: any[]) => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((value) => {
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"` // Enclose in quotes if value contains comma
            }
            return value
          })
          .join(","),
      )
      .join("\n")

    return `${headers}\n${rows}`
  }

  const handleDownload = () => {
    const csv = generateCsv(serviceSheets)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `service_sheets_report_${format(new Date(), "yyyyMMdd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Button onClick={handleDownload} disabled={serviceSheets.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Baixar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados de Todas as Fichas de Serviço</CardTitle>
          <CardDescription>Uma lista abrangente de todas as fichas de serviço para relatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceSheets.length === 0 ? (
            <p className="text-muted-foreground">Nenhum dado disponível para gerar relatórios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Nome do Projeto
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Técnico
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Empresa Cliente
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Data do Serviço
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Aprovado Em
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serviceSheets.map((sheet) => (
                    <tr key={sheet.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {sheet.project_name}
                      </td>
                      <td className="px-6 py-4">{sheet.technician_name}</td>
                      <td className="px-6 py-4">{sheet.client_company}</td>
                      <td className="px-6 py-4">{format(new Date(sheet.service_date), "PPP")}</td>
                      <td className="px-6 py-4">{sheet.status}</td>
                      <td className="px-6 py-4">
                        {sheet.approved_at ? format(new Date(sheet.approved_at), "PPPp") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
