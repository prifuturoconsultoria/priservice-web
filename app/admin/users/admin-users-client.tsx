"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/lib/service-sheets-api";
import {
  getRoleTranslation,
  getRoleOptions,
  type Role,
} from "@/lib/role-translations";
import { useState, useEffect, useMemo } from "react";
import { Users, RefreshCw, Shield, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/lib/hooks/use-data";

export function AdminUsersClient() {
  const { data: rawUsers, mutate, isLoading: usersLoading } = useUsers();
  const users = useMemo(() => rawUsers || [], [rawUsers]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user: any) =>
        (user.fullName || user.full_name || "").toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        getRoleTranslation(user.role).toLowerCase().includes(term)
    );
  }, [searchTerm, users]);

  const handleEditRole = async () => {
    if (!editingUser || !editingUser.role) return;

    setIsLoading(true);

    try {
      const result = await updateUserRole(editingUser.id, editingUser.role);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Função do usuário atualizada com sucesso!",
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        mutate();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar função do usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar função do usuário",
        variant: "destructive",
      });

    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "observer":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const adminCount = users.filter((u: any) => u.role === 'admin').length;
  const technicianCount = users.filter((u: any) => u.role === 'technician').length;
  const observerCount = users.filter((u: any) => u.role === 'observer').length;

  if (usersLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as funções dos usuários do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Registrados no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Com privilégios administrativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technicianCount}</div>
            <p className="text-xs text-muted-foreground">Usuários técnicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificadores</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observerCount}</div>
            <p className="text-xs text-muted-foreground">Usuários verificadores</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários
              </CardTitle>
              <CardDescription>
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {users.length === 0
                  ? "Nenhum usuário encontrado."
                  : "Nenhum resultado para a busca."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id || index}>
                      <TableCell className="font-medium">
                        {user.fullName || user.full_name || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRoleBadgeStyles(user.role)}
                        >
                          {getRoleTranslation(user.role || "technician")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser({ ...user });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Alterar Função
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Função do Usuário</DialogTitle>
            <DialogDescription>
              Altere a função de{" "}
              <strong>{editingUser?.fullName || editingUser?.full_name || editingUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select
                value={editingUser?.role || "technician"}
                onValueChange={(value: string) =>
                  setEditingUser((prev: any) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditRole} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Shield className="h-4 w-4 mr-1" />
              )}
              {isLoading ? "Atualizando..." : "Alterar Função"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
