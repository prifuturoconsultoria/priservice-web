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
  DialogTrigger,
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
  createUser,
  updateUserRole,
  deleteUser,
  resetUserPassword,
  sendMagicLink,
} from "@/lib/admin";
import {
  getRoleTranslation,
  getRoleOptions,
  type Role,
} from "@/lib/role-translations";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Users,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Shield,
  Mail,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "technician" as "admin" | "technician" | "observer",
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateUser = async () => {
    if (
      !createUserData.email ||
      !createUserData.password ||
      !createUserData.fullName
    ) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createUser(
        createUserData.email,
        createUserData.password,
        createUserData.fullName,
        createUserData.role
      );

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: result.message || "Usuário criado com sucesso!",
        });
        setIsCreateDialogOpen(false);
        setCreateUserData({
          email: "",
          password: "",
          fullName: "",
          role: "technician",
        });
        router.refresh();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive",
      });
      console.error("Create user error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        router.refresh();
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
      console.error("Edit role error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || !newPassword) {
      toast({
        title: "Erro",
        description: "Nova senha é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetUserPassword(editingUser.id, newPassword);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Senha do usuário redefinida com sucesso!",
        });
        setIsPasswordDialogOpen(false);
        setEditingUser(null);
        setNewPassword("");
        router.refresh();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao redefinir senha",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha",
        variant: "destructive",
      });
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(true);

    try {
      const result = await deleteUser(userToDelete.id);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Usuário excluído com sucesso!",
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        router.refresh();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao excluir usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
      console.error("Delete user error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMagicLink = async (userEmail: string) => {
    setIsLoading(true);

    try {
      const result = await sendMagicLink(userEmail);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: result.message || "Link de confirmação enviado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao enviar link de confirmação",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar link de confirmação",
        variant: "destructive",
      });
      console.error("Send magic link error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie usuários, funções e permissões do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Adicione um novo usuário ao sistema com email e senha.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={createUserData.email}
                        onChange={(e) =>
                          setCreateUserData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="col-span-3"
                        placeholder="usuario@exemplo.com"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Senha
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={createUserData.password}
                        onChange={(e) =>
                          setCreateUserData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="col-span-3"
                        placeholder="Senha temporária"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fullName" className="text-right">
                        Nome
                      </Label>
                      <Input
                        id="fullName"
                        value={createUserData.fullName}
                        onChange={(e) =>
                          setCreateUserData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        className="col-span-3"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Função
                      </Label>
                      <Select
                        value={createUserData.role}
                        onValueChange={(
                          value: "admin" | "technician" | "observer"
                        ) =>
                          setCreateUserData((prev) => ({
                            ...prev,
                            role: value,
                          }))
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
                    <Button
                      onClick={handleCreateUser}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      {isLoading ? "Criando..." : "Criar Usuário"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>


          {message && (
            <div className="p-3 rounded-md bg-muted text-sm">{message}</div>
          )}

          <div className="space-y-2">
            {initialUsers.map((user, index) => (
              <div
                key={user.id || index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.full_name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-blue-100 text-blue-800"
                          : user.role === "observer"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {getRoleTranslation(user.role || "technician")}
                    </span>
                    {user.last_sign_in_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last login:{" "}
                        {new Date(user.last_sign_in_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUser({ ...user });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Alterar Função
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUser(user);
                          setIsPasswordDialogOpen(true);
                        }}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Redefinir Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSendMagicLink(user.email)}
                        disabled={isLoading}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email de Confirmação
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Função do Usuário</DialogTitle>
            <DialogDescription>
              Altere a função do usuário{" "}
              {editingUser?.full_name || editingUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select
                value={editingUser?.role || "technician"}
                onValueChange={(value: Role) =>
                  setEditingUser((prev) => ({ ...prev, role: value }))
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
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {isLoading ? "Atualizando..." : "Alterar Função"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para{" "}
              {editingUser?.full_name || editingUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
                placeholder="Digite a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleResetPassword}
              disabled={isLoading || !newPassword}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
              Esta ação não pode ser desfeita e todos os dados relacionados
              serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Excluindo..." : "Excluir Usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
