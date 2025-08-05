"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getAllUsers, createUser, updateUserRole, deleteUser, resetUserPassword } from "@/lib/admin"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { UserPlus, Edit, Trash2, Key, Users } from "lucide-react"

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(['admin', 'technician'], { required_error: "Selecione um papel" }),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

type CreateUserData = z.infer<typeof createUserSchema>
type ResetPasswordData = z.infer<typeof resetPasswordSchema>

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "technician",
    },
  })

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  })

  // Check authentication and admin role
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push("/")
        return
      }

      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      if (!authChecked || !isAdmin) return
      
      try {
        const usersList = await getAllUsers()
        setUsers(usersList)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [authChecked, isAdmin])

  const onCreateUser = async (data: CreateUserData) => {
    setCreating(true)
    try {
      const result = await createUser(data.email, data.password, data.fullName, data.role)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Usuário criado com sucesso!",
        })
        setCreateDialogOpen(false)
        createForm.reset()
        // Refresh users list
        const usersList = await getAllUsers()
        setUsers(usersList)
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'technician') => {
    try {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Papel do usuário atualizado!",
        })
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar papel",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar papel do usuário",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Usuário excluído com sucesso!",
        })
        // Remove from local state
        setUsers(users.filter(user => user.id !== userId))
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao excluir usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      })
    }
  }

  const onResetPassword = async (data: ResetPasswordData) => {
    try {
      const result = await resetUserPassword(selectedUserId, data.newPassword)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Senha redefinida com sucesso!",
        })
        setResetDialogOpen(false)
        resetForm.reset()
        setSelectedUserId("")
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao redefinir senha",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha",
        variant: "destructive",
      })
    }
  }

  if (!authChecked || loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  if (!isAdmin) {
    return <div className="text-center text-red-500">Acesso negado</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema. Você pode definir o papel como administrador ou técnico.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateUser)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o papel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technician">Técnico</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Criando..." : "Criar Usuário"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie todos os usuários do sistema. Você pode alterar papéis, redefinir senhas e excluir usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || user.email}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: 'admin' | 'technician') => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technician">
                            <Badge variant="secondary">Técnico</Badge>
                          </SelectItem>
                          <SelectItem value="admin">
                            <Badge>Admin</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setResetDialogOpen(true)
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente
                                o usuário "{user.full_name || user.email}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite uma nova senha para o usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Redefinir Senha
                </Button>
                <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}