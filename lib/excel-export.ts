import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ServiceSheetExportData {
  id: string;
  service_date: string;
  start_time: string;
  end_time: string;
  subject: string;
  status: string;
  profiles?: {
    full_name: string;
  };
  projects?: {
    name: string;
    company: string;
  };
}

export function exportServiceSheetsToExcel(data: ServiceSheetExportData[], filename?: string) {
  // Calculate hours difference
  const calculateHours = (startTime: string, endTime: string): string => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) {
        // Handle overnight work
        diffMinutes += 24 * 60;
      }
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h${minutes.toString().padStart(2, '0')}m`;
      }
    } catch (error) {
      return "N/A";
    }
  };

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

  // Transform data for Excel export
  const excelData = data.map(sheet => ({
    'Data': format(new Date(sheet.service_date), "dd/MM/yyyy"),
    'Colaborador': sheet.profiles?.full_name || 'N/A',
    'Cliente\\Projecto': `${sheet.projects?.company || 'N/A'} - ${sheet.projects?.name || 'N/A'}`,
    'Actividade': sheet.subject || 'N/A',
    'Hora de Início': sheet.start_time,
    'Hora Fim': sheet.end_time,
    'Somatório': calculateHours(sheet.start_time, sheet.end_time),
    'Estado': getStatusLabel(sheet.status)
  }));

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