import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProjectById } from "@/lib/supabase";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Edit, Building, User, Users, Clock } from "lucide-react";
import { getUser, getUserProfile } from "@/lib/auth";
import { redirect } from 'next/navigation';

interface ProjectDetailPageProps {
  params: { id: string }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Detalhes do projeto</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/projects/${project.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Projeto
          </Link>
        </Button>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            Informações do Projeto
          </CardTitle>
          <CardDescription>Dados básicos sobre o projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building className="h-4 w-4" />
                Nome do Projeto
              </div>
              <p className="text-base font-semibold">{project.name}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building className="h-4 w-4" />
                Empresa
              </div>
              <p className="text-base font-semibold">{project.company}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsible Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Responsáveis
          </CardTitle>
          <CardDescription>Pessoas responsáveis pelo projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Responsável Cliente
              </div>
              <p className="text-base font-semibold">{project.client_responsible}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Responsável Parceiro
              </div>
              <p className="text-base font-semibold">{project.partner_responsible}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
            Controle de Horas
          </CardTitle>
          <CardDescription>Horas alocadas e utilizadas no projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Horas Totais
              </div>
              <p className="text-2xl font-bold text-green-600">
                {project.total_hours != null ? `${project.total_hours.toFixed(2)}h` : '0h'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Horas Usadas
              </div>
              <p className="text-2xl font-bold text-red-600">
                {project.used_hours != null ? `${project.used_hours.toFixed(2)}h` : '0h'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Horas Disponíveis
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {project.total_hours != null && project.used_hours != null
                  ? `${(project.total_hours - project.used_hours).toFixed(2)}h`
                  : '0h'}
              </p>
            </div>
          </div>
          {project.total_hours != null && project.total_hours > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">
                  {project.total_hours > 0 ? ((project.used_hours || 0) / project.total_hours * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-300"
                  style={{ width: `${project.total_hours > 0 ? Math.min(((project.used_hours || 0) / project.total_hours) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            Informações do Sistema
          </CardTitle>
          <CardDescription>Dados de criação e atualização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Criado em</div>
              <p className="text-base font-semibold">
                {format(new Date(project.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Última atualização</div>
              <p className="text-base font-semibold">
                {format(new Date(project.updated_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}