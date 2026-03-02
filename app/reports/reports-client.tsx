"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Download, FileBarChart, FileText } from "lucide-react"
import type { ServiceSheet } from "@/types/service-sheet"
import { exportServiceSheetsToExcel } from "@/lib/excel-export"

interface ReportsClientProps {
  serviceSheets: ServiceSheet[]
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100 font-semibold text-xs">Aprovado</Badge>
    case "rejected":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100 font-semibold text-xs">Rejeitado</Badge>
    case "pending":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100 font-semibold text-xs">Pendente</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
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
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" />
                Dados de Todas as Fichas de Serviço
              </CardTitle>
              <CardDescription className="mt-1">Uma lista abrangente de todas as fichas de serviço para relatórios.</CardDescription>
            </div>
            <Button onClick={handleDownload} disabled={serviceSheets.length === 0} className="shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Baixar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {serviceSheets.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Nenhum dado disponível para gerar relatórios.</p>
            </div>
          ) : (
            <ScrollArea className="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Nome do Projeto</TableHead>
                    <TableHead className="font-semibold">Técnico</TableHead>
                    <TableHead className="font-semibold">Empresa Cliente</TableHead>
                    <TableHead className="font-semibold">Data do Serviço</TableHead>
                    <TableHead className="font-semibold text-center">Total Horas</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Aprovado Em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceSheets.map((sheet) => (
                    <TableRow key={sheet.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{sheet.project?.name || 'N/A'}</TableCell>
                      <TableCell>{sheet.createdBy?.fullName || 'N/A'}</TableCell>
                      <TableCell>{sheet.project?.company || 'N/A'}</TableCell>
                      <TableCell>{getDateDisplay(sheet)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
                          {sheet.totalHours?.toFixed(1)}h
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sheet.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sheet.approvedAt ? format(new Date(sheet.approvedAt), "dd/MM/yyyy HH:mm") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  )
}
