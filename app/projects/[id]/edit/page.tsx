import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/supabase";
import ProjectForm from "@/components/project-form";
import { getUser } from "@/lib/auth";
import { redirect } from 'next/navigation';

interface EditProjectPageProps {
  params: { id: string }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
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