import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// This is a Supabase Edge Function for sending approval emails via Resend.
// To deploy this, you would use the Supabase CLI:
// supabase functions deploy send-approval-email --no-verify-jwt
// 
// Required environment variables in Supabase:
// - RESEND_API_KEY: Your Resend API key
// - SITE_URL: Your application URL (e.g., https://yourapp.com)
// - FROM_EMAIL: The email address to send from (must be verified in Resend)

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método Não Permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { serviceSheet, emailType = 'approval', recipientEmail, approved, feedback } = await req.json()
    
    console.log('=== EMAIL FUNCTION DEBUG v2.0 ===')
    console.log('Email function called with emailType:', emailType)
    console.log('Approved:', approved)
    console.log('RecipientEmail:', recipientEmail)
    console.log('Will use notification template:', emailType === 'notification')
    console.log('Request body keys:', Object.keys({ serviceSheet, emailType, recipientEmail, approved, feedback }))
    console.log('==================================')

    if (!serviceSheet) {
      return new Response(JSON.stringify({ error: "Dados de serviceSheet faltando" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // For approval emails, we need the token and client email
    if (emailType === 'approval' && (!serviceSheet.approval_token || !serviceSheet.client_contact_email)) {
      return new Response(JSON.stringify({ error: "Token de aprovação ou email do cliente faltando" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // For notification emails, we need recipient email
    if (emailType === 'notification' && !recipientEmail) {
      return new Response(JSON.stringify({ error: "Email do destinatário faltando para notificação" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const approvalUrl = `${Deno.env.get("SITE_URL")}/approval/${serviceSheet.approval_token}`
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@yourdomain.com"

    let htmlContent, textContent, subject, toEmail;

    // Debug check - force log both comparisons
    console.log('emailType value:', JSON.stringify(emailType))
    console.log('emailType === "notification":', emailType === 'notification')
    console.log('typeof emailType:', typeof emailType)
    
    if (emailType === 'notification') {
      console.log('>>> USING NOTIFICATION TEMPLATE <<<')
      // Notification email for status changes
      const status = approved ? 'aprovada' : 'rejeitada'
      const statusText = approved ? 'APROVADA' : 'REJEITADA'
      const statusColor = approved ? '#10b981' : '#ef4444'
      const bgColor = approved ? '#f0fdf4' : '#fef2f2'
      const borderColor = approved ? '#22c55e' : '#ef4444'
      
      subject = `${approved ? '✅' : '❌'} Sua ficha de serviço foi ${status} - ${serviceSheet.project_name}`
      toEmail = recipientEmail

      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ficha de Serviço ${statusText}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              
              <div style="background-color: ${bgColor}; border-left: 6px solid ${borderColor}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: ${statusColor}; margin: 0 0 10px 0;">${approved ? '🎉' : '😔'} Ficha de Serviço ${statusText}</h2>
                <p style="margin: 0; color: #374151;">
                  ${approved 
                    ? 'Ótimas notícias! Seu cliente aprovou a ficha de serviço.' 
                    : 'Sua ficha de serviço foi rejeitada pelo cliente.'}
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">📋 Detalhes do Serviço</h3>
                <p><strong>Projeto:</strong> ${serviceSheet.project_name}</p>
                <p><strong>Cliente:</strong> ${serviceSheet.client_company}</p>
                <p><strong>Contato:</strong> ${serviceSheet.client_contact_name}</p>
                <p><strong>Data do Serviço:</strong> ${new Date(serviceSheet.service_date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Horário:</strong> ${serviceSheet.start_time} - ${serviceSheet.end_time}</p>
              </div>
              
              ${feedback ? `
              <div style="background-color: ${approved ? '#fef3c7' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${approved ? '#f59e0b' : '#ef4444'};">
                <h4 style="color: ${approved ? '#92400e' : '#dc2626'}; margin: 0 0 10px 0;">💬 Comentário do Cliente</h4>
                <p style="margin: 0; color: ${approved ? '#78350f' : '#7f1d1d'}; font-style: italic;">"${feedback}"</p>
              </div>
              ` : ''}
              
              ${!approved ? `
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <h4 style="color: #1e40af; margin: 0 0 10px 0;">💡 Próximos Passos</h4>
                <p style="margin: 0; color: #1e3a8a;">
                  • Entre em contato com o cliente para esclarecer os pontos de rejeição<br>
                  • Faça os ajustes necessários se aplicável<br>
                  • Considere criar uma nova ficha de serviço se houver trabalho adicional
                </p>
              </div>
              ` : `
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <h4 style="color: #15803d; margin: 0 0 10px 0;">🎯 Serviço Concluído</h4>
                <p style="margin: 0; color: #166534;">
                  Parabéns! O cliente ficou satisfeito com o serviço prestado. 
                  Esta ficha está agora oficialmente aprovada e arquivada.
                </p>
              </div>
              `}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("SITE_URL")}/service-sheets/${serviceSheet.id}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                  📋 Ver Detalhes da Ficha
                </a>
                <a href="${Deno.env.get("SITE_URL")}/service-sheets" 
                   style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  📊 Ver Todas as Fichas
                </a>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Sistema de Gestão de Fichas de Serviço<br>
                  <em>Esta é uma notificação automática</em>
                </p>
              </div>
            </div>
          </body>
        </html>
      `

      textContent = `
${approved ? '🎉 FICHA DE SERVIÇO APROVADA' : '😔 FICHA DE SERVIÇO REJEITADA'}

${approved 
  ? 'Ótimas notícias! Seu cliente aprovou a ficha de serviço.' 
  : 'Sua ficha de serviço foi rejeitada pelo cliente.'}

DETALHES DO SERVIÇO
-------------------
Projeto: ${serviceSheet.project_name}
Cliente: ${serviceSheet.client_company}
Contato: ${serviceSheet.client_contact_name}
Data do Serviço: ${new Date(serviceSheet.service_date).toLocaleDateString('pt-BR')}
Horário: ${serviceSheet.start_time} - ${serviceSheet.end_time}

${feedback ? `COMENTÁRIO DO CLIENTE
--------------------
"${feedback}"

` : ''}${!approved ? `PRÓXIMOS PASSOS
---------------
• Entre em contato com o cliente para esclarecer os pontos de rejeição
• Faça os ajustes necessários se aplicável
• Considere criar uma nova ficha de serviço se houver trabalho adicional` : `SERVIÇO CONCLUÍDO
----------------
Parabéns! O cliente ficou satisfeito com o serviço prestado. 
Esta ficha está agora oficialmente aprovada e arquivada.`}

LINKS ÚTEIS
-----------
Ver detalhes desta ficha: ${Deno.env.get("SITE_URL")}/service-sheets/${serviceSheet.id}
Ver todas as fichas: ${Deno.env.get("SITE_URL")}/service-sheets

Sistema de Gestão de Fichas de Serviço
Esta é uma notificação automática
      `
    } else {
      console.log('>>> USING APPROVAL TEMPLATE <<<')
      // Original approval email
      subject = `Aprovação de Ficha de Serviço - ${serviceSheet.project_name}`
      toEmail = serviceSheet.client_contact_email

      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Aprovação de Ficha de Serviço</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Aprovação de Ficha de Serviço</h2>
              
              <p>Olá <strong>${serviceSheet.client_contact_name}</strong>,</p>
              
              <p>Por favor, revise e aprove a ficha de serviço concluída:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Detalhes do Serviço</h3>
                <p><strong>Projeto:</strong> ${serviceSheet.project_name}</p>
                <p><strong>Técnico:</strong> ${serviceSheet.technician_name}</p>
                <p><strong>Data:</strong> ${new Date(serviceSheet.service_date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Horário:</strong> ${serviceSheet.start_time} - ${serviceSheet.end_time}</p>
                <p><strong>Atividades Realizadas:</strong></p>
                <div style="background-color: white; padding: 10px; border-radius: 4px;">${serviceSheet.activity_description}</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${approvalUrl}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Clique aqui para Aprovar/Rejeitar
                </a>
              </div>
              
              <p style="font-size: 0.9em; color: #6b7280;">
                Se você não conseguir clicar no botão acima, copie e cole este link no seu navegador:<br>
                <a href="${approvalUrl}">${approvalUrl}</a>
              </p>
              
              <p>Obrigado!</p>
            </div>
          </body>
        </html>
      `

      textContent = `
Olá ${serviceSheet.client_contact_name},

Por favor, revise e aprove a ficha de serviço concluída:

DETALHES DO SERVIÇO
-------------------
Projeto: ${serviceSheet.project_name}
Técnico: ${serviceSheet.technician_name}
Data: ${new Date(serviceSheet.service_date).toLocaleDateString('pt-BR')}
Horário: ${serviceSheet.start_time} - ${serviceSheet.end_time}

Atividades Realizadas:
${serviceSheet.activity_description}

Para aprovar ou rejeitar, acesse: ${approvalUrl}

Obrigado!
      `
    }

    // If no Resend API key is set, just simulate the email
    if (!resendApiKey) {
      console.log(`Simulando envio de email para: ${toEmail}`)
      if (emailType === 'approval') {
        console.log(`URL de aprovação: ${approvalUrl}`)
      }
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email simulado - Configure RESEND_API_KEY para envio real",
        ...(emailType === 'approval' && { approvalUrl })
      }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Send email using Resend API
    console.log('Sending email with subject:', subject)
    console.log('To:', toEmail)
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error("Falha no envio de email via Resend:", errorData)
      return new Response(JSON.stringify({ 
        error: 'Falha ao enviar email', 
        details: errorData 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const emailResult = await emailResponse.json()
    console.log("Email enviado com sucesso via Resend:", emailResult)

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email enviado com sucesso",
      emailId: emailResult.id 
    }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erro na Função Edge:", error)
    return new Response(JSON.stringify({ error: "Erro Interno do Servidor", detalhes: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
