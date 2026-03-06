'use client'

import useSWR from 'swr'
import {
  getAllServiceSheets,
  getServiceSheetById,
  getAllProjects,
  getAllUsers,
} from '@/lib/service-sheets-api'
import { getUserProfile } from '@/lib/auth'

export function useServiceSheets() {
  return useSWR('service-sheets', async () => {
    const res = await getAllServiceSheets()
    return res.data || []
  }, { revalidateOnFocus: false })
}

export function useServiceSheet(id: string) {
  return useSWR(id ? `service-sheet-${id}` : null, async () => {
    const res = await getServiceSheetById(id)
    return res.success ? res.data : null
  }, { revalidateOnFocus: false })
}

export function useProjects() {
  return useSWR('projects', () => getAllProjects(), { revalidateOnFocus: false })
}

export function useUsers() {
  return useSWR('users', () => getAllUsers(), { revalidateOnFocus: false })
}

export function useProfile() {
  return useSWR('profile', () => getUserProfile(), { revalidateOnFocus: false })
}
