import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método Não Permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { email, password, fullName, role } = await req.json()

    if (!email || !password || !fullName || !role) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios faltando" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey
    })

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing environment variables' 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName
      },
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: authError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create profile with role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: authData.user.id,
        email: authData.user.email!,
        role, 
        full_name: fullName 
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return new Response(JSON.stringify({
        success: false, 
        error: 'User created but failed to set role'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: authData.user 
    }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erro na Edge Function:", error)
    return new Response(JSON.stringify({ 
      error: "Erro Interno do Servidor", 
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})