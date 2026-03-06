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

import { revalidateTag } from 'next/cache'
import { getUser, getAccessToken } from './auth'
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorBody = await response.json()
        errorMessage = errorBody.message || errorBody.error || errorMessage
      } catch {
        // ignore parse error
      }
      throw new ApiError(response.status, errorMessage)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    const text = await response.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Erro de conexão com o servidor')
  }
}

// ==================== DATA NORMALIZATION ====================

/**
 * Normalize a service sheet from the Spring Boot API response
 * Handles: uppercase status, snake_case fields, missing nested objects
 */
function normalizeServiceSheet(raw: any): ServiceSheet {
  return {
    id: raw.id,
    projectId: raw.projectId || raw.project_id,
    project: raw.project || (raw.projectName || raw.project_name ? {
      id: raw.projectId || raw.project_id || '',
      name: raw.projectName || raw.project_name || '',
      company: raw.clientCompany || raw.client_company || raw.projectCompany || '',
      totalHours: 0,
      usedHours: 0,
    } : undefined),
    subject: raw.subject || '',
    clientContactName: raw.clientContactName || raw.client_contact_name || '',
    clientContactEmail: raw.clientContactEmail || raw.client_contact_email || '',
    clientContactPhone: raw.clientContactPhone || raw.client_contact_phone,
    ccEmails: raw.ccEmails || raw.cc_emails,
    activityDescription: raw.activityDescription || raw.activity_description || '',
    lines: (raw.lines || []).map((line: any) => ({
      id: line.id,
      lineNumber: line.lineNumber || line.line_number,
      serviceDate: line.serviceDate || line.service_date,
      startTime: line.startTime || line.start_time,
      endTime: line.endTime || line.end_time,
      description: line.description,
      hours: line.hours || line.calculatedHours || line.calculated_hours,
    })),
    totalHours: raw.totalHours || raw.total_hours || raw.hours || 0,
    status: (raw.status || 'pending').toLowerCase() as ServiceSheet['status'],
    approvalToken: raw.approvalToken || raw.approval_token || '',
    clientFeedback: raw.clientFeedback || raw.client_feedback,
    approvedAt: raw.approvedAt || raw.approved_at,
    createdBy: raw.createdBy || raw.created_by || (raw.technicianName || raw.technician_name ? {
      id: '',
      fullName: raw.technicianName || raw.technician_name || '',
      email: raw.technicianEmail || raw.technician_email || '',
    } : undefined),
    createdAt: raw.createdAt || raw.created_at || '',
    updatedAt: raw.updatedAt || raw.updated_at || '',
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
    const user = await getUser()
    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const result = await apiRequest<ServiceSheet>('/api/service-sheets', {
      method: 'POST',
      body: JSON.stringify(formData),
    })

    revalidateTag('service-sheets')
    revalidateTag('projects')
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.message }
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
    const user = await getUser()
    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const params = new URLSearchParams()
    if (filters?.page !== undefined) params.append('page', filters.page.toString())
    params.append('size', (filters?.size ?? 500).toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.projectId) params.append('projectId', filters.projectId)

    const queryString = params.toString()
    const endpoint = `/api/service-sheets${queryString ? `?${queryString}` : ''}`

    const result = await apiRequest<any>(endpoint, { method: 'GET' })
    const rawSheets = result.content || result
    const sheets = Array.isArray(rawSheets) ? rawSheets.map(normalizeServiceSheet) : []

    return { success: true, data: sheets }
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.message }
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
    const user = await getUser()
    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const result = await apiRequest<any>(`/api/service-sheets/${id}`, { method: 'GET' })
    return { success: true, data: normalizeServiceSheet(result) }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { success: false, error: 'Ficha de serviço não encontrada' }
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
    const result = await apiRequest<any>(
      `/api/service-sheets/token/${token}`,
      { method: 'GET' }
    )

    return { success: true, data: normalizeServiceSheet(result) }
  } catch (error) {
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
    const user = await getUser()
    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const result = await apiRequest<ServiceSheet>(`/api/service-sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
    revalidateTag('service-sheets')
    revalidateTag(`service-sheet-${id}`)
    revalidateTag('projects')
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { success: false, error: 'Ficha de serviço não encontrada' }
      if (error.status === 403) return { success: false, error: 'Sem permissão para editar esta ficha' }
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
    const user = await getUser()
    if (!user) return { success: false, error: 'Usuário não autenticado' }

    await apiRequest<void>(`/api/service-sheets/${id}`, { method: 'DELETE' })
    revalidateTag('service-sheets')
    revalidateTag('projects')
    return { success: true, message: 'Ficha de serviço deletada com sucesso' }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { success: false, error: 'Ficha de serviço não encontrada' }
      if (error.status === 403) return { success: false, error: 'Sem permissão para deletar esta ficha' }
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
 * @param confirmationEmail Email of person approving (for validation)
 * @param approved true = approve, false = reject
 * @param rejectionReason Optional reason when rejecting
 */
export async function approveServiceSheet(
  token: string,
  confirmationEmail: string,
  approved: boolean,
  rejectionReason?: string
): Promise<ApiResponse<ServiceSheet>> {
  try {
    // Build approval request matching Spring Boot ApproveServiceSheetRequest
    const approvalData: ApprovalDto = {
      confirmationEmail,
      approved,
      rejectionReason: rejectionReason || undefined,
    }

    const result = await apiRequest<ServiceSheet>(
      `/api/service-sheets/token/${token}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(approvalData),
      }
    )

    revalidateTag('service-sheets')
    revalidateTag('projects')
    return {
      success: true,
      data: result,
      message: approved ? 'Ficha aprovada com sucesso!' : 'Ficha rejeitada'
    }
  } catch (error) {
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
    const user = await getUser()
    if (!user) return { success: false, error: 'Usuário não autenticado' }

    await apiRequest<{ message: string }>(`/api/service-sheets/${id}/resend-approval`, { method: 'POST' })
    return { success: true, message: 'Email de aprovação reenviado com sucesso' }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400) return { success: false, error: 'Não é possível reenviar email para ficha já aprovada' }
      if (error.status === 404) return { success: false, error: 'Ficha de serviço não encontrada' }
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
    const user = await getUser()
    if (!user) return []

    const result = await apiRequest<any>('/api/projects?size=200', { method: 'GET' })
    if (Array.isArray(result)) return result
    if (result?.content) return result.content
    return []
  } catch (error) {
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
    const user = await getUser()
    if (!user) return null

    const result = await apiRequest<any>(`/api/projects/${projectId}/hours`, { method: 'GET' })

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
    return null
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(id: string): Promise<any | null> {
  try {
    return await apiRequest<any>(`/api/projects/${id}`, { method: 'GET' })
  } catch (error) {
    return null
  }
}

/**
 * Create a new project
 */
export async function createProject(formData: any): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const data = await apiRequest<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name,
        company: formData.company,
        clientResponsible: formData.client_responsible || formData.clientResponsible,
        partnerResponsible: formData.partner_responsible || formData.partnerResponsible,
        totalHours: formData.total_hours || formData.totalHours,
      }),
    })
    revalidateTag('projects')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create project' }
  }
}

/**
 * Update a project
 */
export async function updateProject(id: string, formData: any): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const data = await apiRequest<any>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: formData.name,
        company: formData.company,
        clientResponsible: formData.client_responsible || formData.clientResponsible,
        partnerResponsible: formData.partner_responsible || formData.partnerResponsible,
        totalHours: formData.total_hours || formData.totalHours,
      }),
    })
    revalidateTag('projects')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update project' }
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest<void>(`/api/projects/${id}`, { method: 'DELETE' })
    revalidateTag('projects')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete project' }
  }
}

// ==================== ADMIN OPERATIONS ====================

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<any[]> {
  try {
    const result = await apiRequest<any>('/api/admin/users?size=200', { method: 'GET' })
    const users = Array.isArray(result) ? result : (result?.content || [])
    // Normalize roles to lowercase (Spring Boot returns uppercase: ADMIN, TECHNICIAN, OBSERVER)
    return users.map((u: any) => ({
      ...u,
      role: u.role ? u.role.toLowerCase() : 'technician',
    }))
  } catch (error) {
    return []
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUser(
  email: string,
  _password: string,
  fullName: string,
  role: 'admin' | 'technician' | 'observer' = 'technician'
): Promise<{ success: boolean; error?: string; user?: any; message?: string }> {
  try {
    const data = await apiRequest<any>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, role: role.toUpperCase() }),
    })
    revalidateTag('users')
    return { success: true, user: data, message: `Usuário ${fullName} criado com sucesso!` }
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao criar usuário' }
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: 'admin' | 'technician' | 'observer'): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest<any>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: role.toUpperCase() }),
    })
    revalidateTag('users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update role' }
  }
}

/**
 * Reset user password (admin only)
 * Note: Not applicable with Azure AD auth — users manage passwords through Microsoft
 */
export async function resetUserPassword(_userId: string, _newPassword: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Redefinição de senha não disponível com autenticação Azure AD' }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest<void>(`/api/admin/users/${userId}`, { method: 'DELETE' })
    revalidateTag('users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete user' }
  }
}

/**
 * Send magic link (admin only)
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Find user by email first — we need the ID for the endpoint
    const users = await getAllUsers()
    const user = users.find((u: any) => u.email === email)
    if (!user) return { success: false, error: 'Usuário não encontrado' }

    const result = await apiRequest<any>(`/api/admin/users/${user.id}/magic-link`, {
      method: 'POST',
    })
    return { success: true, message: result?.message || 'Link enviado com sucesso!' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send magic link' }
  }
}

/**
 * Get current user profile from API
 */
export async function getUserProfileFromApi(): Promise<any | null> {
  try {
    return await apiRequest<any>('/api/profile', { method: 'GET' })
  } catch (error) {
    return null
  }
}
