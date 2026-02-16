"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { useState } from "react"

interface PDFGeneratorProps {
  serviceSheet: any
  variant?: "default" | "outline"
  className?: string
  size?: "default" | "sm" | "lg"
}

export function PDFGenerator({ serviceSheet, variant = "outline", className, size = "default" }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Create a new window with the service sheet data formatted for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Por favor, permita pop-ups para gerar o relatório PDF')
        return
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title></title>
            <style>
              @page {
                margin: 2cm;
                size: A4;
                /* Remove browser generated headers and footers */
                margin-top: 2cm;
                margin-bottom: 2cm;
              }
              
              @media print {
                @page {
                  margin: 2cm;
                  size: A4;
                  /* Completely remove default page headers/footers */
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  margin-top: 1.5cm;
                  margin-bottom: 1.5cm;
                }
                
                /* Hide browser page headers and footers */
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                
                html {
                  margin: 0 !important;
                  padding: 0 !important;
                }
                
                .no-print {
                  display: none !important;
                }
                
                /* Ensure clean page breaks */
                .page-break {
                  page-break-before: always;
                }
                
                /* Hide any potential browser headers */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.4;
                color: #333;
                background: white;
              }
              
              .header {
                position: relative;
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #2563eb;
              }
              
              .header h1 {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 8px;
                font-weight: bold;
              }
              
              .header .subtitle {
                font-size: 14px;
                color: #6b7280;
              }
              
              .logo-top {
                position: absolute;
                top: 0;
                right: 0;
                width: 120px;
                height: auto;
              }
              
              .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-top: 10px;
              }
              
              .status-pending {
                background-color: #fef3c7;
                color: #92400e;
                border: 1px solid #f59e0b;
              }
              
              .status-approved {
                background-color: #d1fae5;
                color: #065f46;
                border: 1px solid #10b981;
              }
              
              .status-rejected {
                background-color: #fee2e2;
                color: #991b1b;
                border: 1px solid #ef4444;
              }
              
              .section {
                margin-bottom: 25px;
                break-inside: avoid;
              }
              
              .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 12px;
                padding-bottom: 6px;
                border-bottom: 2px solid #e5e7eb;
              }
              
              .grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 15px;
              }
              
              .grid-full {
                grid-column: 1 / -1;
              }
              
              .field {
                margin-bottom: 12px;
              }
              
              .field-label {
                font-size: 11px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }
              
              .field-value {
                font-size: 14px;
                color: #1f2937;
                font-weight: 500;
              }
              
              .activity-content {
                background-color: #f9fafb;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                font-size: 13px;
                line-height: 1.6;
              }
              
              .activity-content img {
                max-width: 100%;
                height: auto;
                margin: 10px 0;
                border-radius: 4px;
                border: 1px solid #e5e7eb;
              }
              
              .signatures-section {
                margin-top: 40px;
                page-break-inside: avoid;
              }
              
              .signatures-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 30px;
              }
              
              .signature-box {
                text-align: center;
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                min-height: 120px;
              }
              
              .signature-title {
                font-size: 14px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
              }
              
              .signature-line {
                border-top: 1px solid #6b7280;
                margin-top: 60px;
                padding-top: 8px;
                font-size: 12px;
                color: #6b7280;
              }
              
              .logo-bottom {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              
              .logo-bottom img {
                width: 100px;
                height: auto;
              }
              
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 11px;
                color: #6b7280;
              }
              
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="/logo2.png" alt="Prifuturo Logo" class="logo-top" />
              <h1>Relatório de Intervenção</h1>
              <div class="subtitle">Sistema de Gestão de Fichas de Serviço</div>
              <div class="status-badge status-${serviceSheet.status}">
                ${serviceSheet.status === 'pending' ? 'Pendente' : serviceSheet.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Informações do Projeto</div>
              <div class="grid">
                <div class="field">
                  <div class="field-label">Nome do Projeto</div>
                  <div class="field-value">${serviceSheet.project?.name || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Empresa Cliente</div>
                  <div class="field-value">${serviceSheet.project?.company || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Responsável Cliente</div>
                  <div class="field-value">${serviceSheet.project?.clientResponsible || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Responsável Parceiro</div>
                  <div class="field-value">${serviceSheet.project?.partnerResponsible || 'N/A'}</div>
                </div>
                ${serviceSheet.subject ? `
                <div class="field grid-full">
                  <div class="field-label">Tipo de Intervenção</div>
                  <div class="field-value">${serviceSheet.subject}</div>
                </div>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Detalhes da Intervenção</div>
              <div class="grid">
                <div class="field">
                  <div class="field-label">Técnico Responsável</div>
                  <div class="field-value">${serviceSheet.createdBy?.fullName || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Total de Horas</div>
                  <div class="field-value">${serviceSheet.totalHours?.toFixed(1) || '0'}h (${serviceSheet.lines?.length || 0} ${serviceSheet.lines?.length === 1 ? 'dia' : 'dias'})</div>
                </div>
                ${serviceSheet.approvedAt ? `
                <div class="field">
                  <div class="field-label">Data de ${serviceSheet.status === 'approved' ? 'Aprovação' : 'Processamento'}</div>
                  <div class="field-value">${new Date(serviceSheet.approvedAt).toLocaleDateString('pt-BR')} às ${new Date(serviceSheet.approvedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>` : ''}
              </div>
            </div>

            ${serviceSheet.lines && serviceSheet.lines.length > 0 ? `
            <div class="section">
              <div class="section-title">Dias de Trabalho</div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280;">Data</th>
                    <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280;">Início</th>
                    <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280;">Fim</th>
                    <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280;">Horas</th>
                    <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280;">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  ${serviceSheet.lines.map((line: any) => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 8px; font-size: 13px;">${new Date(line.serviceDate).toLocaleDateString('pt-BR')}</td>
                      <td style="padding: 8px; font-size: 13px;">${line.startTime}</td>
                      <td style="padding: 8px; font-size: 13px;">${line.endTime}</td>
                      <td style="padding: 8px; font-size: 13px;">${line.hours?.toFixed(1) || '0'}h</td>
                      <td style="padding: 8px; font-size: 13px; color: #6b7280;">${line.description || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>` : ''}

            <div class="section">
              <div class="section-title">Informações de Contato</div>
              <div class="grid">
                <div class="field">
                  <div class="field-label">Pessoa de Contato</div>
                  <div class="field-value">${serviceSheet.clientContactName}</div>
                </div>
                <div class="field">
                  <div class="field-label">Email</div>
                  <div class="field-value">${serviceSheet.clientContactEmail}</div>
                </div>
                ${serviceSheet.clientContactPhone ? `
                <div class="field">
                  <div class="field-label">Telefone</div>
                  <div class="field-value">${serviceSheet.clientContactPhone}</div>
                </div>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Atividades Realizadas</div>
              <div class="activity-content">
                ${serviceSheet.activityDescription}
              </div>
            </div>

            ${serviceSheet.clientFeedback ? `
            <div class="section">
              <div class="section-title">Observações do Cliente</div>
              <div class="activity-content">
                ${serviceSheet.clientFeedback.replace(/\n/g, '<br>')}
              </div>
            </div>` : ''}

            <div class="signatures-section">
              <div class="section-title">Assinaturas e Validação</div>
              <div class="signatures-grid">
                <div class="signature-box">
                  <div class="signature-title">Assinatura do Cliente</div>
                  <div class="signature-line">Nome e Assinatura</div>
                </div>
                <div class="signature-box">
                  <div class="signature-title">Assinatura do Parceiro</div>
                  <div class="signature-line">Nome e Assinatura</div>
                </div>
              </div>
            </div>

            <div class="logo-bottom">
              <img src="/primavera_logo.webp" alt="Primavera Logo" />
            </div>

            <div class="footer">
              <div>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
              <div>Sistema de Gestão de Fichas de Serviço</div>
            </div>
          </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()

      // Wait for content to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Close the window after printing (user can cancel)
          printWindow.onafterprint = () => printWindow.close()
        }, 500)
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Erro ao gerar relatório PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      onClick={generatePDF}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
    >
      {isGenerating ? (
        <Printer className="mr-2 h-4 w-4 animate-pulse" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? "Gerando..." : "Baixar Relatório"}
    </Button>
  )
}