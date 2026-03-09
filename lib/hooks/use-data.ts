'use client'

import useSWR from 'swr'
import { apiRequest, getStoredUser } from '@/lib/api-client'

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

export function useServiceSheets() {
  return useSWR('service-sheets', async () => {
    const result = await apiRequest<any>('/api/service-sheets?size=500')
    const rawSheets = result.content || result
    return Array.isArray(rawSheets) ? rawSheets.map(normalizeSheet) : []
  }, { revalidateOnFocus: false })
}

export function useServiceSheet(id: string) {
  return useSWR(id ? `service-sheet-${id}` : null, async () => {
    const result = await apiRequest<any>(`/api/service-sheets/${id}`)
    return result ? normalizeSheet(result) : null
  }, { revalidateOnFocus: false })
}

export function useProjects() {
  return useSWR('projects', async () => {
    const result = await apiRequest<any>('/api/projects?size=500')
    return result.content || result || []
  }, { revalidateOnFocus: false })
}

export function useUsers() {
  return useSWR('users', async () => {
    const result = await apiRequest<any>('/api/admin/users?size=500')
    return result.content || result || []
  }, { revalidateOnFocus: false })
}

export function useProfile() {
  return useSWR('profile', () => {
    const user = getStoredUser()
    if (!user) return null
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
  }, { revalidateOnFocus: false })
}
