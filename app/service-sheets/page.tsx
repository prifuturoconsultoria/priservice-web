"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
} from "@/lib/supabase";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Search, Filter, Calendar, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ServiceSheetsPage() {
  const [serviceSheets, setServiceSheets] = useState([]);
  const [filteredSheets, setFilteredSheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const itemsPerPage = 8;
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!authChecked) return; // Wait for auth check
      const sheets = await getAllServiceSheets();
      setServiceSheets(sheets);
      setFilteredSheets(sheets);
      setLoading(false);
    }
    fetchData();
  }, [authChecked]);

  useEffect(() => {
    let filtered = serviceSheets;

    if (searchTerm) {
      filtered = filtered.filter(
        (sheet) =>
          sheet.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sheet.technician_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          sheet.client_company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sheet) => sheet.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((sheet) => sheet.service_date === dateFilter);
    }

    setFilteredSheets(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, serviceSheets]);

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
        setFilteredSheets(
          sheets.filter((sheet) => {
            const matchesSearch =
              !searchTerm ||
              sheet.project_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              sheet.technician_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              sheet.client_company
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesStatus =
              statusFilter === "all" || sheet.status === statusFilter;
            const matchesDate =
              !dateFilter || sheet.service_date === dateFilter;
            return matchesSearch && matchesStatus && matchesDate;
          })
        );
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

  if (!authChecked || loading) {
    return (
      <div className="flex justify-center items-center h-64">Carregando...</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todas as Fichas de Serviço</h1>
        <Button asChild>
          <Link href="/service-sheets/new">Criar Nova</Link>
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Search className="h-5 w-5" />
                Filtros e Busca
              </CardTitle>
            </div>
            {(searchTerm || statusFilter !== "all" || dateFilter) && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredSheets.length} resultado
                {filteredSheets.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por projeto, técnico ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                  />
                </div>
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                <Filter className="h-4 w-4 mr-2" />
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
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 h-11 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-blue-100"
                  onClick={() => setDateFilter("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || dateFilter) && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>Filtros ativos:</span>
                {searchTerm && (
                  <Badge
                    variant="outline"
                    className="bg-white border-blue-300 text-blue-800"
                  >
                    Busca: "{searchTerm}"
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge
                    variant="outline"
                    className="bg-white border-blue-300 text-blue-800"
                  >
                    Status:{" "}
                    {statusFilter === "pending"
                      ? "Pendente"
                      : statusFilter === "approved"
                      ? "Aprovado"
                      : "Rejeitado"}
                  </Badge>
                )}
                {dateFilter && (
                  <Badge
                    variant="outline"
                    className="bg-white border-blue-300 text-blue-800"
                  >
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
                  setDateFilter("");
                }}
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fichas de Serviço</CardTitle>
              <CardDescription>
                {filteredSheets.length} de {serviceSheets.length} ficha
                {serviceSheets.length !== 1 ? "s" : ""} encontrada
                {serviceSheets.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de{" "}
              {Math.ceil(filteredSheets.length / itemsPerPage)}
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
                      <TableHead>Projeto</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((sheet) => (
                      <TableRow key={sheet.id}>
                        <TableCell className="font-medium">
                          {sheet.project_name}
                        </TableCell>
                        <TableCell>{sheet.technician_name}</TableCell>
                        <TableCell>{sheet.client_company}</TableCell>
                        <TableCell>
                          {format(new Date(sheet.service_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(sheet.status)}>
                            {getStatusLabel(sheet.status)}
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
                                <Link
                                  href={`/service-sheets/${sheet.id}`}
                                  className="flex items-center"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </Link>
                              </DropdownMenuItem>
                              {sheet.status !== "approved" && (
                                <>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/service-sheets/${sheet.id}/edit`}
                                      className="flex items-center"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleResendEmail(sheet.id)}
                                    disabled={resendingId === sheet.id}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    {resendingId === sheet.id
                                      ? "Reenviando..."
                                      : "Reenviar Email"}
                                  </DropdownMenuItem>
                                </>
                              )}
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
                                    <AlertDialogTitle>
                                      Tem certeza?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso
                                      excluirá permanentemente a ficha de
                                      serviço "{sheet.project_name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(sheet.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={deletingId === sheet.id}
                                    >
                                      {deletingId === sheet.id
                                        ? "Excluindo..."
                                        : "Excluir"}
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
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a{" "}
                    {Math.min(endIndex, filteredSheets.length)} de{" "}
                    {filteredSheets.length} resultados
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
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
                              <span className="px-2 text-muted-foreground">
                                ...
                              </span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
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
    </div>
  );
}
