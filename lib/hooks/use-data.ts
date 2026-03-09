'use client'

import useSWR from 'swr'
import { apiRequest, getStoredUser } from '@/lib/api-client'

const swrOptions = {
  revalidateOnFocus: false,
  onError: (error: Error, key: string) => {
    console.error(`[SWR] ${key} failed:`, error.message)
  },
}

function normalizeSheet(raw: any) {
  return {
    ...raw,
    status: (raw.status || 'pending').toLowerCase(),
    lines: (raw.lines || []).map((line: any) => ({
      ...line,
      hours: line.hours || line.calculatedHours,
    })),
    totalHours: raw.totalHours || raw.hours || 0,
  }
}

export interface ServiceSheetsFilters {
  page?: number
  size?: number
  search?: string
  status?: string
  project?: string
  date?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export function useServiceSheets(filters: ServiceSheetsFilters = {}) {
  const { page = 0, size = 8, search, status, project, date } = filters

  // Build query string
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (search) params.set('search', search)
  if (status && status !== 'all') params.set('status', status)
  if (project && project !== 'all') params.set('project', project)
  if (date) params.set('date', date)

  const key = `service-sheets?${params.toString()}`

  return useSWR(key, async () => {
    const result = await apiRequest<any>(`/api/service-sheets?${params.toString()}`)
    const rawSheets = result.content || []
    return {
      content: Array.isArray(rawSheets) ? rawSheets.map(normalizeSheet) : [],
      totalElements: result.totalElements || 0,
      totalPages: result.totalPages || 1,
      number: result.number || 0,
      size: result.size || size,
    } as PaginatedResponse<any>
  }, swrOptions)
}

export function useServiceSheet(id: string) {
  return useSWR(id ? `service-sheet-${id}` : null, async () => {
    const result = await apiRequest<any>(`/api/service-sheets/${id}`)
    return result ? normalizeSheet(result) : null
  }, swrOptions)
}

export function useProjects() {
  return useSWR('projects', async () => {
    const result = await apiRequest<any>('/api/projects?size=500')
    return result.content || result || []
  }, swrOptions)
}

export function useUsers() {
  return useSWR('users', async () => {
    const result = await apiRequest<any>('/api/admin/users?size=500')
    return result.content || result || []
  }, swrOptions)
}

export function useDashboardStats() {
  return useSWR('dashboard-stats', async () => {
    return await apiRequest<any>('/api/statistics/dashboard')
  }, swrOptions)
}

export function useProfile() {
  return useSWR('profile', () => {
    const user = getStoredUser()
    if (!user) return null
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
  }, swrOptions)
}
