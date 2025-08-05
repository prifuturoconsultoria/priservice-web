"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function getUserProfile() {
  const user = await getUser()
  if (!user) return null
  
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
    
  // If profile doesn't exist, create it
  if (!profile) {
    try {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          role: user.email === 'nlanga@prifuturoconsultoria.com' ? 'admin' : 'technician'
        })
        .select()
        .single()
      
      return newProfile
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }
    
  return profile
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}