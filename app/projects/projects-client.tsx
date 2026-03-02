"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getAllProjects } from "@/lib/service-sheets-api";
import { deleteProject } from "@/lib/service-sheets-api";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Edit, Trash2, Search, X, Sparkles, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectsClientProps {
  initialData: any[]
}

export function ProjectsClient({ initialData }: ProjectsClientProps) {
  const [projects, setProjects] = useState(initialData);
  const [filteredProjects, setFilteredProjects] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const itemsPerPage = 8;
  const { toast } = useToast();

  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.clientResponsible || project.client_responsible || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.partnerResponsible || project.partner_responsible || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [searchTerm, projects]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredProjects.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteProject(id);
      if (result.success) {
        // Refresh the data
        const projectsData = await getAllProjects();
        setProjects(projectsData);
        toast({
          title: "Sucesso!",
          description: "Projeto excluído com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: `Erro ao excluir projeto: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir projeto",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Filters Section */}
      <Card className="bg-gradient-to-r from-slate-50/80 to-blue-50/50 border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Search className="h-5 w-5 text-primary" />
                Busca
              </CardTitle>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredProjects.length} resultado{filteredProjects.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por projeto, empresa ou responsáveis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-blue-100"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {searchTerm && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>Filtros ativos:</span>
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-800">
                  Busca: "{searchTerm}"
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Projetos
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              Página {currentPage} de {Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">
                {projects.length === 0
                  ? "Nenhum projeto encontrado."
                  : "Nenhum resultado encontrado para os filtros aplicados."}
              </p>
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground/70 mt-1">Crie um para começar!</p>
              )}
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Resp. Cliente</TableHead>
                      <TableHead>Resp. Parceiro</TableHead>
                      <TableHead className="text-center">Horas Totais</TableHead>
                      <TableHead className="text-center">Horas Usadas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.company}</TableCell>
                        <TableCell>{project.clientResponsible || project.client_responsible || '-'}</TableCell>
                        <TableCell>{project.partnerResponsible || project.partner_responsible || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                            {(project.totalHours || project.total_hours) ? `${Number(project.totalHours || project.total_hours).toFixed(1)}h` : '0h'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-semibold">
                            {(project.usedHours || project.used_hours) ? `${Number(project.usedHours || project.used_hours).toFixed(1)}h` : '0h'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/projects/${project.id}`} className="flex items-center">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/projects/${project.id}/edit`} className="flex items-center">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto "{project.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(project.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={deletingId === project.id}
                                    >
                                      {deletingId === project.id ? "Excluindo..." : "Excluir"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 pt-6 pb-2">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a <span className="font-medium text-foreground">{Math.min(endIndex, filteredProjects.length)}</span> de <span className="font-medium text-foreground">{filteredProjects.length}</span> resultados
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}