import { getUser, getUserProfile } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage() {
  const [user, profile] = await Promise.all([
    getUser(),
    getUserProfile(),
  ])

  if (!user) redirect('/login')
  if (profile?.role !== 'admin') redirect('/')

  return <AdminUsersClient />
}
