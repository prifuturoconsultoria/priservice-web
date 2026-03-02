import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { ServiceSheet } from '@/types/service-sheet';

export function exportServiceSheetsToExcel(data: ServiceSheet[], filename?: string) {
  // Get status label in Portuguese
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  // Transform data for Excel export - expand multi-line sheets into separate rows
  const excelData: any[] = [];

  data.forEach(sheet => {
    // Each sheet can have multiple lines (days of work)
    if (sheet.lines && sheet.lines.length > 0) {
      sheet.lines.forEach(line => {
        excelData.push({
          'Data': format(new Date(line.serviceDate), "dd/MM/yyyy"),
          'Colaborador': sheet.createdBy?.fullName || 'N/A',
          'Cliente\\Projecto': `${sheet.project?.company || 'N/A'} - ${sheet.project?.name || 'N/A'}`,
          'Actividade': sheet.subject || 'N/A',
          'Hora de Início': line.startTime,
          'Hora Fim': line.endTime,
          'Somatório': (line.hours || (line as any).calculatedHours) ? `${((line.hours || (line as any).calculatedHours) as number).toFixed(1)}h` : 'N/A',
          'Descrição': line.description || '',
          'Estado': getStatusLabel(sheet.status)
        });
      });
    }
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Data
    { wch: 20 }, // Colaborador
    { wch: 30 }, // Cliente\Projecto
    { wch: 25 }, // Actividade
    { wch: 12 }, // Hora de Início
    { wch: 12 }, // Hora Fim
    { wch: 12 }, // Somatório
    { wch: 30 }, // Descrição
    { wch: 12 }  // Estado
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fichas de Serviço');

  // Generate filename with current date if not provided
  const defaultFilename = `fichas-de-servico-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // Write and download file
  XLSX.writeFile(workbook, finalFilename);
}