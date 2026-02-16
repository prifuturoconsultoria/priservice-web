"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { ServiceSheet } from "@/types/service-sheet"
import { exportServiceSheetsToExcel } from "@/lib/excel-export"

interface ReportsClientProps {
  serviceSheets: ServiceSheet[]
}

export function ReportsClient({ serviceSheets }: ReportsClientProps) {
  const handleDownload = () => {
    exportServiceSheetsToExcel(serviceSheets)
  }

  // Get date display for multi-line sheets
  const getDateDisplay = (sheet: ServiceSheet): string => {
    if (!sheet.lines || sheet.lines.length === 0) return "N/A";

    if (sheet.lines.length === 1) {
      return format(new Date(sheet.lines[0].serviceDate), "dd/MM/yyyy");
    }

    // Multi-day sheet: show date range
    return `${format(new Date(sheet.lines[0].serviceDate), "dd/MM")} - ${format(new Date(sheet.lines[sheet.lines.length - 1].serviceDate), "dd/MM/yy")}`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div></div>
        <Button onClick={handleDownload} disabled={serviceSheets.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Baixar Excel
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
                      Total Horas
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
                        {sheet.project?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">{sheet.createdBy?.fullName || 'N/A'}</td>
                      <td className="px-6 py-4">{sheet.project?.company || 'N/A'}</td>
                      <td className="px-6 py-4">{getDateDisplay(sheet)}</td>
                      <td className="px-6 py-4">{sheet.totalHours?.toFixed(1)}h</td>
                      <td className="px-6 py-4 capitalize">{sheet.status}</td>
                      <td className="px-6 py-4">
                        {sheet.approvedAt ? format(new Date(sheet.approvedAt), "dd/MM/yyyy HH:mm") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}