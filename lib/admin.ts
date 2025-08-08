"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuth } from "./auth"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'


function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  console.log('Environment check:', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...', // Show first 20 chars
    serviceKeyLength: supabaseServiceKey?.length
  })
  
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Test the admin client separately
export async function testAdminClient() {
  console.log('Testing admin client...')
  const adminSupabase = createAdminClient()
  
  try {
    // Test a simple admin operation
    const { data, error } = await adminSupabase.auth.admin.listUsers()
    console.log('Admin client test:', { users: data?.users?.length, error })
    return { success: !error, error: error?.message }
  } catch (err) {
    console.error('Admin client test failed:', err)
    return { success: false, error: 'Admin client failed' }
  }
}


// Check if user is admin
export async function requireAdmin() {
  const user = await requireAuth()
  const supabase = await createClient()
  
  console.log('User from auth:', user) // Debug: Check if user exists
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile query result:', { profile, error }) // Debug: See what's returned

    if (error) {
      console.error('Error checking admin role:', error)
      throw new Error('not_admin')
    }

    if (!profile || profile.role !== 'admin') {
      console.log('Profile check failed:', { profile, expectedRole: 'admin' }) // Debug
      throw new Error('not_admin')
    }

    return user
  } catch (error) {
    console.error('Admin check failed:', error)
    throw new Error('not_admin')
  }
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
export async function createUser(email: string, password: string, fullName: string, role: 'admin' | 'technician' | 'observer' = 'technician') {
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
export async function updateUserRole(userId: string, role: 'admin' | 'technician' | 'observer') {
  await requireAdmin()
  const supabase = await createClient()

  // Use RPC to bypass RLS for admin operations
  const { error } = await supabase.rpc('update_user_role', {
    target_user_id: userId,
    new_role: role
  })

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Delete user (admin only)
export async function deleteUser(userId: string) {
  await requireAdmin()
  testAdminClient()
  const adminSupabase = createAdminClient() // ✅ Use admin client instead of createClient()

  // Delete from auth.users (this will cascade to profiles)
  const { error } = await adminSupabase.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Reset user password (admin only)
export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()
  const adminSupabase = createAdminClient() // ✅ Use admin client instead of createClient()

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) {
    console.error('Error resetting password:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Send magic link (admin only)
export async function sendMagicLink(email: string) {
  await requireAdmin()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email
  })

  if (error) {
    console.error('Error generating magic link:', error)
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Link de confirmação enviado com sucesso!' }
}