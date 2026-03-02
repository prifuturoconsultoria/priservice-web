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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Search, Filter, Calendar, X, Sparkles, Download, Clock, ChevronUp, ChevronDown, ChevronsUpDown, FileDown, FileText, FolderOpen, Check } from "lucide-react";
import { exportServiceSheetsToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";
import { PDFGenerator } from "@/components/pdf-generator";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  const [projectComboOpen, setProjectComboOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  // Get unique projects for filter (with company)
  const uniqueProjects = Array.from(
    new Map(
      serviceSheets
        .filter(s => s.project?.name)
        .map(s => [s.project!.name, { name: s.project!.name, company: s.project?.company || "" }])
    ).values()
  );
  const filteredProjectOptions = uniqueProjects.filter(p =>
    `${p.company} ${p.name}`.toLowerCase().includes(projectSearch.toLowerCase())
  );
  const selectedProjectInfo = uniqueProjects.find(p => p.name === projectFilter);

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

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100";
      default:
        return "";
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
        const response = await getAllServiceSheets();
        setServiceSheets(response.data || []);
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
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por projeto, técnico ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Popover open={projectComboOpen} onOpenChange={setProjectComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-[220px] justify-between h-9 text-sm font-normal shrink-0",
                      projectFilter === "all" && "text-muted-foreground"
                    )}
                  >
                    {selectedProjectInfo ? (
                      <span className="truncate">{selectedProjectInfo.company}</span>
                    ) : (
                      "Projecto"
                    )}
                    {projectFilter !== "all" ? (
                      <X
                        className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectFilter("all");
                        }}
                      />
                    ) : (
                      <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Pesquisar projecto..."
                      value={projectSearch}
                      onValueChange={setProjectSearch}
                    />
                    <CommandList className="max-h-[220px]">
                      {filteredProjectOptions.length === 0 ? (
                        <CommandEmpty>Nenhum projecto encontrado.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredProjectOptions.map((project) => {
                            const isSelected = projectFilter === project.name;
                            return (
                              <CommandItem
                                key={project.name}
                                value={project.name}
                                onSelect={() => {
                                  setProjectFilter(isSelected ? "all" : project.name);
                                  setProjectComboOpen(false);
                                  setProjectSearch("");
                                }}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 cursor-pointer",
                                  isSelected && "bg-blue-50/80"
                                )}
                              >
                                <div className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                                  isSelected ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                  {project.company.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className={cn("text-sm truncate", isSelected ? "font-semibold" : "font-medium")}>{project.company}</span>
                                  <span className="text-xs text-muted-foreground truncate">{project.name}</span>
                                </div>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-[160px] shrink-0">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-9 text-sm"
                />
                {dateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setDateFilter("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Button
                onClick={handleExportExcel}
                size="sm"
                variant="outline"
                className="h-9 text-xs shrink-0"
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                Excel
              </Button>
            </div>

            {(searchTerm || statusFilter !== "all" || projectFilter !== "all" || dateFilter) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <span>Filtros:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 gap-1">
                    "{searchTerm}"
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {projectFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 gap-1">
                    {selectedProjectInfo?.company}
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setProjectFilter("all")} />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 gap-1">
                    {statusFilter === "pending" ? "Pendente" : statusFilter === "approved" ? "Aprovado" : "Rejeitado"}
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setStatusFilter("all")} />
                  </Badge>
                )}
                {dateFilter && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 gap-1">
                    {format(new Date(dateFilter), "dd/MM/yyyy")}
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setDateFilter("")} />
                  </Badge>
                )}
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("all"); setProjectFilter("all"); setDateFilter(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
                >
                  Limpar tudo
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Fichas de Serviço
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              Página {currentPage} de {Math.max(1, Math.ceil(filteredSheets.length / itemsPerPage))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSheets.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">
                {serviceSheets.length === 0
                  ? "Nenhuma ficha de serviço encontrada."
                  : "Nenhum resultado encontrado para os filtros aplicados."}
              </p>
              {serviceSheets.length === 0 && (
                <p className="text-sm text-muted-foreground/70 mt-1">Crie uma para começar!</p>
              )}
            </div>
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
                        <TableCell className="font-medium">{sheet.project?.name || 'N/A'}</TableCell>
                        <TableCell>{sheet.createdBy?.fullName || 'N/A'}</TableCell>
                        <TableCell>{sheet.project?.company || 'N/A'}</TableCell>
                        <TableCell>{getDateDisplay(sheet)}</TableCell>
                        <TableCell className="text-center font-mono">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {displayHours(sheet)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold text-xs ${getStatusBadgeClasses(sheet.status)}`}>
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
                                  
                                  {/* Edit and Email actions - only if not approved (admin and technician) */}
                                  {sheet.status !== "approved" && userProfile?.role !== 'observer' && (
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
                                  
                                  {/* Delete action - admin and technician */}
                                  {userProfile?.role !== 'observer' && (
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
                                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a ficha de serviço "{sheet.project?.name || 'N/A'}".
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
                <div className="flex items-center justify-between space-x-2 pt-6 pb-2">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a <span className="font-medium text-foreground">{Math.min(endIndex, filteredSheets.length)}</span> de <span className="font-medium text-foreground">{filteredSheets.length}</span> resultados
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