import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllProjects } from "@/lib/supabase";
import { getUser, getUserProfile } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  if (profile?.role === 'observer') {
    redirect('/')
  }
  
  const projects = await getAllProjects()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos os Projetos</h1>
        <Button asChild>
          <Link href="/projects/new">Criar Novo</Link>
        </Button>
      </div>

      <ProjectsClient initialData={projects} />
    </div>
  );
}