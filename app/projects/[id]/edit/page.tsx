import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/service-sheets-api";
import ProjectForm from "@/components/project-form";
import { getUser, getUserProfile } from "@/lib/auth";
import { redirect } from 'next/navigation';

interface EditProjectPageProps {
  params: { id: string }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  if (profile?.role === 'observer') {
    redirect('/')
  }

  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <ProjectForm initialData={project} isEditing={true} />
    </div>
  );
}