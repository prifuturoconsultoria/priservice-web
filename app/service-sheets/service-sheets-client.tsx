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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  getAllServiceSheets,
  deleteServiceSheet,
  resendApprovalEmail,
  getCurrentUserProfile,
} from "@/lib/service-sheets-api";
import type { ServiceSheet } from "@/types/service-sheet";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Search, Filter, Calendar, X, Sparkles, Download, Clock, ChevronUp, ChevronDown, ChevronsUpDown, FileDown } from "lucide-react";
import { exportServiceSheetsToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";
import { PDFGenerator } from "@/components/pdf-generator";
import { useRouter } from "next/navigation";

interface ServiceSheetsClientProps {
  initialData: ServiceSheet[]
}

export function ServiceSheetsClient({ initialData }: ServiceSheetsClientProps) {
  const [serviceSheets, setServiceSheets] = useState<ServiceSheet[]>(initialData);
  const [filteredSheets, setFilteredSheets] = useState<ServiceSheet[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sortField, setSortField] = useState<'project' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 8;
  const { toast } = useToast();
  const router = useRouter();

  // Display hours from API (already calculated)
  const displayHours = (sheet: ServiceSheet): string => {
    return sheet.totalHours ? `${sheet.totalHours.toFixed(1)}h` : "N/A";
  };

  // Get date display for multi-line sheets
  const getDateDisplay = (sheet: ServiceSheet): string => {
    if (!sheet.lines || sheet.lines.length === 0) return "N/A";

    if (sheet.lines.length === 1) {
      return format(new Date(sheet.lines[0].serviceDate), "dd/MM/yyyy");
    }

    // Multi-day sheet: show date range
    return `${format(new Date(sheet.lines[0].serviceDate), "dd/MM")} - ${format(new Date(sheet.lines[sheet.lines.length - 1].serviceDate), "dd/MM/yy")}`;
  };

  // Get unique projects for filter
  const uniqueProjects = Array.from(new Set(serviceSheets.map(sheet => sheet.project?.name).filter(Boolean)));

  // Handle sorting
  const handleSort = (field: 'project' | 'date') => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a different field, set new field with asc direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon for a field
  const getSortIcon = (field: 'project' | 'date') => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;
  };

  // Load user profile to check permissions
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
    loadUserProfile();
  }, []);

  useEffect(() => {
    let filtered = serviceSheets;

    if (searchTerm) {
      filtered = filtered.filter(
        (sheet) =>
          sheet.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sheet.createdBy?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          sheet.project?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sheet) => sheet.status === statusFilter);
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter((sheet) => sheet.project?.name === projectFilter);
    }

    if (dateFilter) {
      // Check if any line matches the date filter
      filtered = filtered.filter((sheet) =>
        sheet.lines?.some(line => line.serviceDate === dateFilter)
      );
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        if (sortField === 'project') {
          aValue = a.project?.name || '';
          bValue = b.project?.name || '';
        } else if (sortField === 'date') {
          // Sort by first service date
          aValue = a.lines && a.lines.length > 0 ? new Date(a.lines[0].serviceDate) : new Date(0);
          bValue = b.lines && b.lines.length > 0 ? new Date(b.lines[0].serviceDate) : new Date(0);
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredSheets(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, projectFilter, dateFilter, serviceSheets, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredSheets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredSheets.slice(startIndex, endIndex);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteServiceSheet(id);
      if (result.success) {
        // Refresh the data
        const sheets = await getAllServiceSheets();
        setServiceSheets(sheets);
        toast({
          title: "Sucesso!",
          description: "Ficha de serviço excluída com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: `Erro ao excluir ficha de serviço: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir ficha de serviço",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleResendEmail = async (id: string) => {
    setResendingId(id);
    try {
      const result = await resendApprovalEmail(id);
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: result.message || "Email reenviado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao reenviar email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reenviar email",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleExportExcel = () => {
    try {
      exportServiceSheetsToExcel(filteredSheets);
      toast({
        title: "Sucesso!",
        description: "Dados exportados para Excel com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar dados para Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Filters Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                <Search className="h-4 w-4" />
                Filtros e Busca
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportExcel}
                size="sm"
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 h-7 text-xs"
              >
                <FileDown className="h-3 w-3 mr-1" />
                Exportar Excel
              </Button>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                {filteredSheets.length} resultado{filteredSheets.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por projeto, técnico ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-blue-100"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-8 h-9 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-blue-100"
                  onClick={() => setDateFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || projectFilter !== "all" || dateFilter) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <span>Filtros ativos:</span>
                {searchTerm && (
                  <Badge variant="outline" className="bg-white border-blue-300 text-blue-800 text-xs px-2 py-0">
                    Busca: "{searchTerm}"
                  </Badge>
                )}
                {projectFilter !== "all" && (
                  <Badge variant="outline" className="bg-white border-blue-300 text-blue-800 text-xs px-2 py-0">
                    Projeto: {projectFilter}
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="bg-white border-blue-300 text-blue-800 text-xs px-2 py-0">
                    Status: {statusFilter === "pending" ? "Pendente" : statusFilter === "approved" ? "Aprovado" : "Rejeitado"}
                  </Badge>
                )}
                {dateFilter && (
                  <Badge variant="outline" className="bg-white border-blue-300 text-blue-800 text-xs px-2 py-0">
                    Data: {format(new Date(dateFilter), "dd/MM/yyyy")}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setProjectFilter("all");
                  setDateFilter("");
                }}
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 h-7 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fichas de Serviço</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {Math.ceil(filteredSheets.length / itemsPerPage)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSheets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {serviceSheets.length === 0
                ? "Nenhuma ficha de serviço encontrada. Crie uma para começar!"
                : "Nenhum resultado encontrado para os filtros aplicados."}
            </p>
          ) : (
            <>
              <ScrollArea className="h-[600px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('project')}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          <div className="flex items-center gap-1">
                            Projeto
                            {getSortIcon('project')}
                          </div>
                        </Button>
                      </TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('date')}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          <div className="flex items-center gap-1">
                            Data
                            {getSortIcon('date')}
                          </div>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4" />
                          Total de Horas
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((sheet) => (
                      <TableRow 
                        key={sheet.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/service-sheets/${sheet.id}`)}
                      >
                        <TableCell className="font-medium">{sheet.projects?.name || 'N/A'}</TableCell>
                        <TableCell>{sheet.profiles?.full_name || 'N/A'}</TableCell>
                        <TableCell>{sheet.projects?.company || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(sheet.service_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-center font-mono">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {calculateHours(sheet.start_time, sheet.end_time)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(sheet.status)}>
                            {getStatusLabel(sheet.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Observer: only view details and download report */}
                              {userProfile?.role === 'observer' ? (
                                <>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/service-sheets/${sheet.id}`} className="flex items-center">
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalhes
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div className="w-full">
                                      <PDFGenerator 
                                        serviceSheet={sheet}
                                        variant="ghost" 
                                        size="sm"
                                        className="w-full justify-start p-0 h-auto"
                                      />
                                    </div>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  {/* Admin and Technician: full access (with restrictions) */}
                                  <DropdownMenuItem asChild>
                                    <Link href={`/service-sheets/${sheet.id}`} className="flex items-center">
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalhes
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div className="w-full">
                                      <PDFGenerator 
                                        serviceSheet={sheet}
                                        variant="ghost" 
                                        size="sm"
                                        className="w-full justify-start p-0 h-auto"
                                      />
                                    </div>
                                  </DropdownMenuItem>
                                  
                                  {/* Edit and Email actions - only if not approved and user has permission */}
                                  {sheet.status !== "approved" && userProfile?.role === 'admin' && (
                                    <>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/service-sheets/${sheet.id}/edit`} className="flex items-center">
                                          <Edit className="mr-2 h-4 w-4" />
                                          Editar
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleResendEmail(sheet.id)}
                                        disabled={resendingId === sheet.id}
                                      >
                                        <Mail className="mr-2 h-4 w-4" />
                                        {resendingId === sheet.id ? "Reenviando..." : "Reenviar Email"}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {/* Delete action - only for admins */}
                                  {userProfile?.role === 'admin' && (
                                    <>
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
                                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a ficha de serviço "{sheet.projects?.name || 'N/A'}".
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDelete(sheet.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              disabled={deletingId === sheet.id}
                                            >
                                              {deletingId === sheet.id ? "Excluindo..." : "Excluir"}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSheets.length)} de {filteredSheets.length} resultados
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