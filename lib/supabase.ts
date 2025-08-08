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

  // Ensure user has a profile (create if missing)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    console.log('Creating profile for user during service sheet creation')
    try {
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          role: user.email === 'nlanga@prifuturoconsultoria.com' ? 'admin' : 'technician'
        })
      console.log('Profile created successfully')
    } catch (profileError) {
      console.log('Could not create profile, continuing with service sheet creation:', profileError)
    }
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
  const { data, error } = await supabase
    .from("service_sheets")
    .select(`
      *,
      projects!project_id(name, company, client_responsible, partner_responsible),
      profiles!created_by(full_name, email)
    `)
    .eq("approval_token", token)
    .single()

  if (error) {
    console.error("Error fetching service sheet by token:", error)
    return null
  }
  return data
}

// Helper function to send notification email about approval/rejection
async function sendNotificationEmail(serviceSheet: any, approved: boolean, feedback: string) {
  try {
    console.log('sendNotificationEmail called with:', { approved, feedback, created_by: serviceSheet.created_by })
    const supabase = await createServerSupabaseClient()
    
    // First try to get email from profiles table
    console.log('Looking for creator profile with ID:', serviceSheet.created_by)
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', serviceSheet.created_by)
      .single()

    console.log('Profile query result:', { profile, profileError })

    let creatorEmail = null
    let creatorName = null

    if (profile?.email) {
      creatorEmail = profile.email
      creatorName = profile.full_name
      console.log('Found email in profiles table:', creatorEmail)
    } else {
      console.log('Profile not found. Attempting to create profile from current user data.')
      
      // Try to get the user's email from auth.users by getting current user context
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.id === serviceSheet.created_by) {
        // This is the current user, we can use their auth data
        console.log('Creator is current authenticated user, using auth data')
        creatorEmail = user.email
        creatorName = user.user_metadata?.full_name || user.email
        
        // Create the missing profile with real data
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: creatorName,
              role: 'technician'
            })
          
          if (insertError) {
            console.log('Profile creation failed (might already exist):', insertError)
          } else {
            console.log('Successfully created profile for current user')
          }
        } catch (profileCreateError) {
          console.log('Error creating profile:', profileCreateError)
        }
      } else {
        // This is a different user, we need to create a migration function
        console.log('Creator is not current user. This requires a profile migration.')
        console.log('Current user ID:', user?.id, 'Creator ID:', serviceSheet.created_by)
        
        // For now, fallback to the hardcoded email until profiles are properly migrated
        creatorEmail = 'nlanga@prifuturoconsultoria.com'
        creatorName = 'Técnico'
        
        console.log('Using fallback email due to missing profile system')
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not set")
      return
    }

    console.log('Sending notification email to:', creatorEmail, 'with emailType: notification')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-approval-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        serviceSheet,
        emailType: 'notification',
        recipientEmail: creatorEmail,
        approved,
        feedback
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Failed to send notification email:", errorData)
      return
    }

    const result = await response.json()
    console.log("Notification email sent successfully:", result)
  
  } catch (error) {
    console.error("Error calling notification email function:", error)
  }
}

export async function approveServiceSheet(token: string, feedback = "", approved = true) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("service_sheets")
    .update({
      status: approved ? "approved" : "rejected",
      client_feedback: feedback,
      approved_at: new Date().toISOString(),
    })
    .eq("approval_token", token)
    .select()
    .single()

  if (error) {
    console.error("Error updating service sheet status:", error)
    return { success: false, error: error.message }
  }

  // Always try to send email notification - don't fail the approval if email fails
  try {
    console.log('Attempting to send notification email for sheet:', data.id)
    await sendNotificationEmail(data, approved, feedback)
    console.log('Email notification completed')
  } catch (emailError) {
    console.error("Error sending notification email:", emailError)
    // Don't fail the approval process if email fails
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

  let query = supabase
    .from("service_sheets")
    .select(`
      *,
      projects!project_id(name, company, client_responsible, partner_responsible),
      profiles!created_by(full_name, email)
    `)

  // Filter based on user role:
  // - Admin and Observer can see all service sheets
  // - Technician can only see their own service sheets
  if (profile?.role === 'technician') {
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
  const { data, error } = await supabase
    .from("service_sheets")
    .select(`
      *,
      projects!project_id(name, company, client_responsible, partner_responsible),
      profiles!created_by(full_name, email)
    `)
    .eq("id", id)
    .single()

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

// Get current user profile
export async function getCurrentUserProfile() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// Project CRUD operations
export async function createProject(formData: any) {
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

  const { data: project, error } = await supabase.from("projects").insert([dataWithCreator]).select().single()

  if (error) {
    console.error("Error creating project:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: project }
}

export async function getAllProjects() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // All users can see all projects for service sheet creation
  // This allows technicians to select any project when creating service sheets
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }
  return data || []
}

export async function getProjectById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching project by ID:", error)
    return null
  }
  return data
}

export async function updateProject(id: string, formData: any) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating project:", error)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function deleteProject(id: string) {
  const supabase = await createServerSupabaseClient()
  
  // First check if project has any associated service sheets
  const { data: serviceSheets, error: checkError } = await supabase
    .from("service_sheets")
    .select("id")
    .eq("project_id", id)
    .limit(1)
  
  if (checkError) {
    console.error("Error checking project dependencies:", checkError)
    return { success: false, error: "Erro ao verificar dependências do projeto" }
  }
  
  if (serviceSheets && serviceSheets.length > 0) {
    return { 
      success: false, 
      error: "Não é possível excluir este projeto pois existem fichas de serviço associadas. Exclua primeiro as fichas de serviço relacionadas." 
    }
  }
  
  // If no dependencies, proceed with deletion
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// Get service sheets count for a project
export async function getProjectServiceSheetsCount(projectId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { count, error } = await supabase
    .from("service_sheets")
    .select("*", { count: 'exact', head: true })
    .eq("project_id", projectId)
  
  if (error) {
    console.error("Error counting service sheets:", error)
    return 0
  }
  
  return count || 0
}

// Migration function to create profiles for existing users
export async function migrateUserProfiles() {
  const supabase = await createServerSupabaseClient()
  
  try {
    console.log('Starting user profile migration...')
    
    // Get current user to ensure they're authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Check if current user has a profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Create profile for current user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          role: user.email === 'nlanga@prifuturoconsultoria.com' ? 'admin' : 'technician'
        })

      if (profileError) {
        console.error('Error creating profile for current user:', profileError)
        return { success: false, error: "Could not create profile for current user" }
      }
      
      console.log('Created profile for current user')
    }

    return { success: true, message: "Profile migration completed successfully" }
    
  } catch (error) {
    console.error('Error during profile migration:', error)
    return { success: false, error: "Migration failed" }
  }
}
