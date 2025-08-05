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
    const { serviceSheet } = await req.json()

    if (!serviceSheet || !serviceSheet.approval_token || !serviceSheet.client_contact_email) {
      return new Response(JSON.stringify({ error: "Dados de serviceSheet faltando" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const approvalUrl = `${Deno.env.get("SITE_URL")}/approval/${serviceSheet.approval_token}`
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@yourdomain.com"

    // Create HTML email content
    const htmlContent = `
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
              <p style="background-color: white; padding: 10px; border-radius: 4px; white-space: pre-line;">${serviceSheet.activity_description}</p>
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

    // Text version for email clients that don't support HTML
    const textContent = `
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

    // If no Resend API key is set, just simulate the email
    if (!resendApiKey) {
      console.log(`Simulando envio de email para: ${serviceSheet.client_contact_email}`)
      console.log(`URL de aprovação: ${approvalUrl}`)
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email simulado - Configure RESEND_API_KEY para envio real",
        approvalUrl 
      }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [serviceSheet.client_contact_email],
        subject: `Aprovação de Ficha de Serviço - ${serviceSheet.project_name}`,
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
