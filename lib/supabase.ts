"use server"

import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

// Helper function to send approval email
async function sendApprovalEmail(serviceSheet: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not set")
      return
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-approval-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ serviceSheet }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Failed to send approval email:", errorData)
      return
    }

    const result = await response.json()
    console.log("Email sent successfully:", result)
  
  } catch (error) {
    console.error("Error calling email function:", error)
  }
}

export async function createServiceSheet(formData: any) {
  const supabase = await createServerSupabaseClient()
  
  // Get current user to set created_by
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  // Add created_by to form data
  const dataWithCreator = {
    ...formData,
    created_by: user.id
  }

  const { data: serviceSheet, error } = await supabase.from("service_sheets").insert([dataWithCreator]).select().single()

  if (error) {
    console.error("Error creating service sheet:", error)
    return { success: false, error: error.message }
  }

  await sendApprovalEmail(serviceSheet) // Call the placeholder email function

  return { success: true, data: serviceSheet }
}

export async function getServiceSheetByToken(token: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("service_sheets").select("*").eq("approval_token", token).single()

  if (error) {
    console.error("Error fetching service sheet by token:", error)
    return null
  }
  return data
}

export async function approveServiceSheet(token: string, feedback = "", approved = true) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("service_sheets")
    .update({
      status: approved ? "approved" : "rejected",
      client_feedback: feedback,
      approved_at: approved ? new Date().toISOString() : null,
    })
    .eq("approval_token", token)
    .select()
    .single()

  if (error) {
    console.error("Error updating service sheet status:", error)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function getAllServiceSheets() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase.from("service_sheets").select("*")

  // If not admin, filter by created_by to show only user's own service sheets
  if (profile?.role !== 'admin') {
    query = query.eq('created_by', user.id)
  }
  
  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching service sheets:", error)
    return []
  }
  return data || []
}

export async function getServiceSheetById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("service_sheets").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching service sheet by ID:", error)
    return null
  }
  return data
}

export async function deleteServiceSheet(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from("service_sheets").delete().eq("id", id)

  if (error) {
    console.error("Error deleting service sheet:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function updateServiceSheet(id: string, formData: any) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("service_sheets")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating service sheet:", error)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function resendApprovalEmail(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: serviceSheet, error } = await supabase.from("service_sheets").select("*").eq("id", id).single()

  if (error || !serviceSheet) {
    console.error("Error fetching service sheet for resend:", error)
    return { success: false, error: "Ficha de serviço não encontrada" }
  }

  // Only allow resending for pending or rejected sheets
  if (serviceSheet.status === "approved") {
    return { success: false, error: "Não é possível reenviar email para fichas aprovadas" }
  }

  try {
    await sendApprovalEmail(serviceSheet)
    return { success: true, message: "Email de aprovação reenviado com sucesso" }
  } catch (error) {
    console.error("Error resending approval email:", error)
    return { success: false, error: "Erro ao reenviar email" }
  }
}
