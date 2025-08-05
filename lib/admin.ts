"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuth } from "./auth"

// Check if user is admin
export async function requireAdmin() {
  const user = await requireAuth()
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Access denied: Admin role required')
  }

  return user
}

// Get all users (admin only)
export async function getAllUsers() {
  await requireAdmin()
  const supabase = await createClient()
  
  // Use RPC to bypass RLS and get all profiles
  const { data: profiles, error } = await supabase.rpc('get_all_profiles')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return profiles || []
}

// Create new user (admin only) - direct approach
export async function createUser(email: string, password: string, fullName: string, role: 'admin' | 'technician' = 'technician') {
  await requireAdmin()
  
  try {
    // Create user using signUp (this should work with RLS policies)
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      return { success: false, error: 'Email já está em uso' }
    }

    // Use signUp to create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Falha ao criar usuário' }
    }

    // Create/update profile with the specified role
    // Use RPC to bypass RLS for admin creation
    const { error: profileError } = await supabase.rpc('create_user_profile', {
      user_id: authData.user.id,
      user_email: authData.user.email!,
      user_full_name: fullName,
      user_role: role
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return { success: false, error: 'Usuário criado mas falha ao definir papel' }
    }

    return { 
      success: true, 
      message: `Usuário ${fullName} criado com sucesso!`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role
      }
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'Falha ao criar usuário' }
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'admin' | 'technician') {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Delete user (admin only)
export async function deleteUser(userId: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Delete from auth.users (this will cascade to profiles)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Reset user password (admin only)
export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) {
    console.error('Error resetting password:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}