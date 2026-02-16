'use server'

/**
 * Service Sheets API - Server Actions
 *
 * Server-side functions that replace Supabase service sheet operations
 * Uses Spring Boot REST API with JWT authentication from cookies
 *
 * NOTE: The POST to localhost:3000 you see in network tab is Next.js
 * serializing the Server Action call. Internally, this function executes
 * on the server and makes a fetch to Spring Boot (localhost:8080).
 */

import { cookies } from 'next/headers'
import { getUser } from './auth'
import type {
  ServiceSheet,
  CreateServiceSheetDto,
  UpdateServiceSheetDto,
  ApprovalDto,
  ServiceSheetFilters,
  ApiResponse,
} from '@/types/service-sheet'

// Custom error class
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Get base URL for Spring Boot API
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
}

/**
 * Get access token from cookies
 */
async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('access_token')?.value || null
}

/**
 * Generic API request handler with authentication
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${endpoint}`
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  console.log(`[Service Sheets API] ${options?.method || 'GET'} ${url}`)
  console.log(`[Service Sheets API] Headers:`, { ...headers, Authorization: token ? 'Bearer ***' : 'none' })

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store', // Ensure fresh data
    })

    console.log(`[Service Sheets API] Response status:`, response.status)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorBody = await response.json()
        console.error(`[Service Sheets API] Error body:`, errorBody)
        errorMessage = errorBody.message || errorBody.error || errorMessage
      } catch (e) {
        console.error(`[Service Sheets API] Could not parse error body:`, e)
      }

      console.error(`[Service Sheets API] Request failed:`, errorMessage)
      throw new ApiError(response.status, errorMessage)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      console.log(`[Service Sheets API] 204 No Content response`)
      return undefined as T
    }

    const data = await response.json()
    console.log(`[Service Sheets API] Success response:`, data)
    return data as T
  } catch (error) {
    if (error instanceof ApiError) throw error

    console.error('[Service Sheets API] Network/parsing error:', error)
    console.error('[Service Sheets API] Error details:', error instanceof Error ? error.message : String(error))
    throw new ApiError(0, 'Erro de conexão com o servidor')
  }
}

// ==================== SERVICE SHEET OPERATIONS ====================

/**
 * Create a new service sheet
 * Replaces: createServiceSheet() from lib/supabase.ts
 */
export async function createServiceSheet(
  formData: CreateServiceSheetDto
): Promise<ApiResponse<ServiceSheet>> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      console.error('[createServiceSheet] User not authenticated')
      return { success: false, error: 'Usuário não autenticado' }
    }

    console.log('[createServiceSheet] Creating service sheet for user:', user.email)
    console.log('[createServiceSheet] Form data:', JSON.stringify(formData, null, 2))

    // Call API
    const result = await apiRequest<ServiceSheet>('/api/service-sheets', {
      method: 'POST',
      body: JSON.stringify(formData),
    })

    console.log('[createServiceSheet] Success! Created service sheet:', result.id)
    return { success: true, data: result }
  } catch (error) {
    console.error('[createServiceSheet] Caught error:', error)
    console.error('[createServiceSheet] Error type:', error instanceof ApiError ? 'ApiError' : typeof error)
    console.error('[createServiceSheet] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[createServiceSheet] Error stack:', error instanceof Error ? error.stack : 'No stack')

    if (error instanceof ApiError) {
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao criar ficha de serviço' }
  }
}

/**
 * Get all service sheets (filtered by role on backend)
 * Replaces: getAllServiceSheets() from lib/supabase.ts
 */
export async function getAllServiceSheets(
  filters?: ServiceSheetFilters
): Promise<ApiResponse<ServiceSheet[]>> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Build query parameters
    const params = new URLSearchParams()
    if (filters?.page !== undefined) params.append('page', filters.page.toString())
    if (filters?.size !== undefined) params.append('size', filters.size.toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.projectId) params.append('projectId', filters.projectId)

    const queryString = params.toString()
    const endpoint = `/api/service-sheets${queryString ? `?${queryString}` : ''}`

    const result = await apiRequest<any>(endpoint, { method: 'GET' })

    // Handle paginated response (content array) or direct array
    const sheets = result.content || result

    return { success: true, data: sheets }
  } catch (error) {
    console.error('[getAllServiceSheets] Error:', error)

    if (error instanceof ApiError) {
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao buscar fichas de serviço' }
  }
}

/**
 * Get service sheet by ID
 * Replaces: getServiceSheetById() from lib/supabase.ts
 */
export async function getServiceSheetById(
  id: string
): Promise<ApiResponse<ServiceSheet>> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const result = await apiRequest<ServiceSheet>(`/api/service-sheets/${id}`, {
      method: 'GET',
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('[getServiceSheetById] Error:', error)

    if (error instanceof ApiError) {
      if (error.status === 404) {
        return { success: false, error: 'Ficha de serviço não encontrada' }
      }
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao buscar ficha de serviço' }
  }
}

/**
 * Get service sheet by approval token (PUBLIC - no auth required)
 * Replaces: getServiceSheetByToken() from lib/supabase.ts
 */
export async function getServiceSheetByToken(
  token: string
): Promise<ApiResponse<ServiceSheet>> {
  try {
    // No authentication required for public approval page
    const result = await apiRequest<ServiceSheet>(
      `/api/service-sheets/token/${token}`,
      { method: 'GET' }
    )

    return { success: true, data: result }
  } catch (error) {
    console.error('[getServiceSheetByToken] Error:', error)

    if (error instanceof ApiError) {
      if (error.status === 404) {
        return { success: false, error: 'Token inválido ou ficha não encontrada' }
      }
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao buscar ficha de serviço' }
  }
}

/**
 * Update service sheet
 * Replaces: updateServiceSheet() from lib/supabase.ts
 */
export async function updateServiceSheet(
  id: string,
  formData: UpdateServiceSheetDto
): Promise<ApiResponse<ServiceSheet>> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const result = await apiRequest<ServiceSheet>(`/api/service-sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('[updateServiceSheet] Error:', error)

    if (error instanceof ApiError) {
      if (error.status === 404) {
        return { success: false, error: 'Ficha de serviço não encontrada' }
      }
      if (error.status === 403) {
        return { success: false, error: 'Sem permissão para editar esta ficha' }
      }
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao atualizar ficha de serviço' }
  }
}

/**
 * Delete service sheet
 * Replaces: deleteServiceSheet() from lib/supabase.ts
 */
export async function deleteServiceSheet(id: string): Promise<ApiResponse<void>> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    await apiRequest<void>(`/api/service-sheets/${id}`, {
      method: 'DELETE',
    })

    return { success: true, message: 'Ficha de serviço deletada com sucesso' }
  } catch (error) {
    console.error('[deleteServiceSheet] Error:', error)

    if (error instanceof ApiError) {
      if (error.status === 404) {
        return { success: false, error: 'Ficha de serviço não encontrada' }
      }
      if (error.status === 403) {
        return { success: false, error: 'Sem permissão para deletar esta ficha' }
      }
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao deletar ficha de serviço' }
  }
}

/**
 * Approve or reject service sheet (PUBLIC with email validation)
 * Replaces: approveServiceSheet() from lib/supabase.ts
 *
 * @param token Approval token from email link
 * @param feedback Optional client feedback
 * @param approverEmail Email of person approving (for validation)
 * @param approved true = approve, false = reject
 */
export async function approveServiceSheet(
  token: string,
  feedback: string,
  approverEmail: string,
  approved: boolean
): Promise<ApiResponse<ServiceSheet>> {
  try {
    // Build approval request
    const approvalData: ApprovalDto = {
      approverEmail,
      feedback: feedback || undefined,
      approved,
    }

    const result = await apiRequest<ServiceSheet>(
      `/api/service-sheets/token/${token}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(approvalData),
      }
    )

    return {
      success: true,
      data: result,
      message: approved ? 'Ficha aprovada com sucesso!' : 'Ficha rejeitada'
    }
  } catch (error) {
    console.error('[approveServiceSheet] Error:', error)

    if (error instanceof ApiError) {
      // Special handling for 403 Forbidden (wrong email)
      if (error.status === 403) {
        return {
          success: false,
          error: 'Apenas o contato principal pode aprovar esta ficha. Você está usando um email em cópia (CC).'
        }
      }
      if (error.status === 400) {
        return {
          success: false,
          error: 'Esta ficha já foi processada anteriormente'
        }
      }
      if (error.status === 404) {
        return {
          success: false,
          error: 'Token inválido ou ficha não encontrada'
        }
      }
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao processar aprovação' }
  }
}

/**
 * Resend approval email
 * Replaces: resendApprovalEmail() from lib/supabase.ts
 */
export async function resendApprovalEmail(id: string): Promise<ApiResponse<void>> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    await apiRequest<{ message: string }>(
      `/api/service-sheets/${id}/resend-approval`,
      {
        method: 'POST',
      }
    )

    return { success: true, message: 'Email de aprovação reenviado com sucesso' }
  } catch (error) {
    console.error('[resendApprovalEmail] Error:', error)

    if (error instanceof ApiError) {
      if (error.status === 400) {
        return { success: false, error: 'Não é possível reenviar email para ficha já aprovada' }
      }
      if (error.status === 404) {
        return { success: false, error: 'Ficha de serviço não encontrada' }
      }
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Erro ao reenviar email de aprovação' }
  }
}

/**
 * Get current user profile (helper function)
 * Replaces: getCurrentUserProfile() from lib/supabase.ts
 */
export async function getCurrentUserProfile() {
  return await getUser()
}

// ==================== PROJECT OPERATIONS ====================

/**
 * Get all projects
 * Replaces: getAllProjects() from lib/supabase.ts
 */
export async function getAllProjects(): Promise<any[]> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      console.warn('[getAllProjects] User not authenticated')
      return []
    }

    // Request 200 projects to avoid pagination issues
    const result = await apiRequest<any>('/api/projects?size=200', {
      method: 'GET',
    })

    // The API returns a direct array of projects
    if (Array.isArray(result)) {
      console.log('[getAllProjects] Successfully loaded', result.length, 'projects')
      return result
    }

    // Handle paginated response (Spring Boot sometimes returns { content: [...], page: {...} })
    if (result && typeof result === 'object' && Array.isArray(result.content)) {
      console.log('[getAllProjects] Loaded paginated response:', result.content.length, 'projects')
      return result.content
    }

    console.warn('[getAllProjects] Unexpected response format:', typeof result)
    return []
  } catch (error) {
    console.error('[getAllProjects] Error:', error)
    return []
  }
}

/**
 * Get project hours information
 * Replaces: getProjectHoursInfo() from lib/supabase.ts
 */
export async function getProjectHoursInfo(projectId: string): Promise<{
  totalHours: number
  usedHours: number
  availableHours: number
  projectName: string
} | null> {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      console.warn('[getProjectHoursInfo] User not authenticated')
      return null
    }

    const result = await apiRequest<any>(`/api/projects/${projectId}/hours`, {
      method: 'GET',
    })

    if (!result) return null

    // Transform API response to expected format
    return {
      totalHours: result.totalHours || result.total_hours || 0,
      usedHours: result.usedHours || result.used_hours || 0,
      availableHours: result.availableHours || result.available_hours ||
        ((result.totalHours || result.total_hours || 0) - (result.usedHours || result.used_hours || 0)),
      projectName: result.projectName || result.name || ''
    }
  } catch (error) {
    console.error('[getProjectHoursInfo] Error:', error)
    return null
  }
}
