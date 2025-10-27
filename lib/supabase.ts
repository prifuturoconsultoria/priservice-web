"use server"

import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

// Helper function to calculate hours from start and end time
function calculateHoursFromTime(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0

  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute

  const diffMinutes = endTotalMinutes - startTotalMinutes
  const hours = diffMinutes / 60

  return Math.max(0, hours) // Ensure non-negative
}

// Helper function to check if project has sufficient hours
async function checkProjectHours(projectId: string, hoursToAdd: number, excludeServiceSheetId?: string) {
  const supabase = await createServerSupabaseClient()

  // Get project with hours
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("total_hours, used_hours, name")
    .eq("id", projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: "Projeto não encontrado" }
  }

  // Calculate current used hours
  let currentUsedHours = project.used_hours || 0

  // If editing, subtract the old hours from current used hours to get accurate available hours
  if (excludeServiceSheetId) {
    const { data: oldServiceSheet } = await supabase
      .from("service_sheets")
      .select("start_time, end_time")
      .eq("id", excludeServiceSheetId)
      .single()

    if (oldServiceSheet) {
      const oldHours = calculateHoursFromTime(oldServiceSheet.start_time, oldServiceSheet.end_time)
      currentUsedHours = Math.max(0, currentUsedHours - oldHours)
    }
  }

  // Check if adding new hours would exceed total hours
  const newUsedHours = currentUsedHours + hoursToAdd

  if (newUsedHours > project.total_hours) {
    const availableHours = project.total_hours - currentUsedHours
    return {
      success: false,
      error: `Horas insuficientes no projeto "${project.name}". Disponível: ${availableHours.toFixed(2)}h, Solicitado: ${hoursToAdd.toFixed(2)}h`
    }
  }

  return { success: true, availableHours: project.total_hours - currentUsedHours }
}

// Helper function to send approval email
async function sendApprovalEmail(serviceSheet: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
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
      return
    }

    const result = await response.json()
  
  } catch (error) {
  }
}

export async function createServiceSheet(formData: any) {
  const supabase = await createServerSupabaseClient()

  // Get current user to set created_by
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  // Calculate hours from start_time and end_time
  const calculatedHours = calculateHoursFromTime(formData.start_time, formData.end_time)

  // Validate hours against project availability
  if (calculatedHours > 0 && formData.project_id) {
    const hoursCheck = await checkProjectHours(formData.project_id, calculatedHours)
    if (!hoursCheck.success) {
      return { success: false, error: hoursCheck.error }
    }
  }

  // Ensure user has a profile (create if missing)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    try {
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          role: user.email === 'nlanga@prifuturoconsultoria.com' ? 'admin' : 'technician'
        })
    } catch (profileError) {
    }
  }

  // Add created_by to form data (no hours_logged column in service_sheets)
  const dataWithCreator = {
    ...formData,
    created_by: user.id
  }

  const { data: serviceSheet, error } = await supabase.from("service_sheets").insert([dataWithCreator]).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Update project's used_hours
  if (calculatedHours > 0 && formData.project_id) {
    // Get current project hours
    const { data: project } = await supabase
      .from("projects")
      .select("used_hours")
      .eq("id", formData.project_id)
      .single()

    if (project) {
      const newUsedHours = (project.used_hours || 0) + calculatedHours

      const { error: projectError } = await supabase
        .from("projects")
        .update({ used_hours: newUsedHours })
        .eq("id", formData.project_id)

      if (projectError) {
        console.error('Error updating project hours:', projectError)
      }
    }
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
    return null
  }
  return data
}

// Helper function to send notification email about approval/rejection
async function sendNotificationEmail(serviceSheet: any, approved: boolean, feedback: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // First try to get email from profiles table
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', serviceSheet.created_by)
      .single()


    let creatorEmail = null
    let creatorName = null

    if (profile?.email) {
      creatorEmail = profile.email
      creatorName = profile.full_name
    } else {
      
      // Try to get the user's email from auth.users by getting current user context
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.id === serviceSheet.created_by) {
        // This is the current user, we can use their auth data
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
          } else {
          }
        } catch (profileCreateError) {
        }
      } else {
        // This is a different user, we need to create a migration function
        
        // For now, fallback to the hardcoded email until profiles are properly migrated
        creatorEmail = 'nlanga@prifuturoconsultoria.com'
        creatorName = 'Técnico'
        
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return
    }

    
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
      return
    }

    const result = await response.json()
  
  } catch (error) {
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
    return { success: false, error: error.message }
  }

  // Always try to send email notification - don't fail the approval if email fails
  try {
    await sendNotificationEmail(data, approved, feedback)
  } catch (emailError) {
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
    return null
  }
  return data
}

export async function deleteServiceSheet(id: string) {
  const supabase = await createServerSupabaseClient()

  // Get the service sheet to calculate hours before deleting
  const { data: serviceSheet } = await supabase
    .from("service_sheets")
    .select("start_time, end_time, project_id")
    .eq("id", id)
    .single()

  if (!serviceSheet) {
    return { success: false, error: "Ficha de serviço não encontrada" }
  }

  // Calculate hours from the service sheet
  const hours = calculateHoursFromTime(serviceSheet.start_time, serviceSheet.end_time)

  // Delete the service sheet
  const { error } = await supabase.from("service_sheets").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Update project's used_hours by subtracting the hours
  if (hours > 0 && serviceSheet.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("used_hours")
      .eq("id", serviceSheet.project_id)
      .single()

    if (project) {
      const updatedUsedHours = Math.max(0, (project.used_hours || 0) - hours)
      await supabase
        .from("projects")
        .update({ used_hours: updatedUsedHours })
        .eq("id", serviceSheet.project_id)
    }
  }

  return { success: true }
}

export async function updateServiceSheet(id: string, formData: any) {
  const supabase = await createServerSupabaseClient()

  // Get the old service sheet to compare hours
  const { data: oldServiceSheet } = await supabase
    .from("service_sheets")
    .select("start_time, end_time, project_id")
    .eq("id", id)
    .single()

  if (!oldServiceSheet) {
    return { success: false, error: "Ficha de serviço não encontrada" }
  }

  // Calculate old and new hours
  const oldHours = calculateHoursFromTime(oldServiceSheet.start_time, oldServiceSheet.end_time)
  const newHours = calculateHoursFromTime(formData.start_time, formData.end_time)

  const oldProjectId = oldServiceSheet.project_id
  const newProjectId = formData.project_id

  // Validate new hours against project availability
  if (newHours > 0 && newProjectId) {
    const hoursCheck = await checkProjectHours(newProjectId, newHours, id)
    if (!hoursCheck.success) {
      return { success: false, error: hoursCheck.error }
    }
  }

  // Update the service sheet
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
    return { success: false, error: error.message }
  }

  // Update project hours if changed
  if (oldProjectId === newProjectId) {
    // Same project - just update the difference
    const hoursDiff = newHours - oldHours
    if (hoursDiff !== 0) {
      const { data: project } = await supabase
        .from("projects")
        .select("used_hours")
        .eq("id", newProjectId)
        .single()

      if (project) {
        const updatedUsedHours = (project.used_hours || 0) + hoursDiff
        await supabase
          .from("projects")
          .update({ used_hours: updatedUsedHours })
          .eq("id", newProjectId)
      }
    }
  } else {
    // Different project - subtract from old, add to new
    // Subtract from old project
    if (oldHours > 0 && oldProjectId) {
      const { data: oldProject } = await supabase
        .from("projects")
        .select("used_hours")
        .eq("id", oldProjectId)
        .single()

      if (oldProject) {
        const updatedOldUsedHours = Math.max(0, (oldProject.used_hours || 0) - oldHours)
        await supabase
          .from("projects")
          .update({ used_hours: updatedOldUsedHours })
          .eq("id", oldProjectId)
      }
    }

    // Add to new project
    if (newHours > 0 && newProjectId) {
      const { data: newProject } = await supabase
        .from("projects")
        .select("used_hours")
        .eq("id", newProjectId)
        .single()

      if (newProject) {
        const updatedNewUsedHours = (newProject.used_hours || 0) + newHours
        await supabase
          .from("projects")
          .update({ used_hours: updatedNewUsedHours })
          .eq("id", newProjectId)
      }
    }
  }

  return { success: true, data }
}

export async function resendApprovalEmail(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: serviceSheet, error } = await supabase.from("service_sheets").select("*").eq("id", id).single()

  if (error || !serviceSheet) {
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
    return []
  }
  return data || []
}

export async function getProjectById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error) {
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
    return 0
  }

  return count || 0
}

// Get project hours information
export async function getProjectHoursInfo(projectId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: project, error } = await supabase
    .from("projects")
    .select("total_hours, used_hours, name")
    .eq("id", projectId)
    .single()

  if (error || !project) {
    return null
  }

  return {
    totalHours: project.total_hours || 0,
    usedHours: project.used_hours || 0,
    availableHours: (project.total_hours || 0) - (project.used_hours || 0),
    projectName: project.name
  }
}

// Migration function to create profiles for existing users
export async function migrateUserProfiles() {
  const supabase = await createServerSupabaseClient()
  
  try {
    
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
        return { success: false, error: "Could not create profile for current user" }
      }
      
    }

    return { success: true, message: "Profile migration completed successfully" }
    
  } catch (error) {
    return { success: false, error: "Migration failed" }
  }
}
