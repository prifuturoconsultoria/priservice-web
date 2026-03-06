import { getUser, getUserProfile } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  const [user, profile] = await Promise.all([getUser(), getUserProfile()])
  if (!user) redirect('/login')
  if (profile?.role === 'observer') redirect('/')

  return <ProjectsClient />
}
