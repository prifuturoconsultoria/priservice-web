"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { migrateUserProfiles } from "@/lib/supabase"
import { createUser } from "@/lib/admin"
import { getRoleTranslation, getRoleOptions } from "@/lib/role-translations"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Users, RefreshCw } from "lucide-react"

export function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createUserData, setCreateUserData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "technician" as "admin" | "technician" | "observer"
  })
  const router = useRouter()

  const handleMigrateProfiles = async () => {
    setIsLoading(true)
    setMessage("")
    
    try {
      const result = await migrateUserProfiles()
      
      if (result.success) {
        setMessage("✅ Profile migration completed successfully!")
        router.refresh()
      } else {
        setMessage(`❌ Migration failed: ${result.error}`)
      }
    } catch (error) {
      setMessage("❌ Error during migration")
      console.error('Migration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!createUserData.email || !createUserData.password || !createUserData.fullName) {
      setMessage("❌ Todos os campos são obrigatórios")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const result = await createUser(
        createUserData.email,
        createUserData.password,
        createUserData.fullName,
        createUserData.role
      )

      if (result.success) {
        setMessage(`✅ ${result.message}`)
        setIsCreateDialogOpen(false)
        setCreateUserData({
          email: "",
          password: "",
          fullName: "",
          role: "technician"
        })
        router.refresh()
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setMessage("❌ Erro ao criar usuário")
      console.error('Create user error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Profile Management
          </CardTitle>
          <CardDescription>
            Manage user profiles and fix missing profile data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
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
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
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
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, fullName: e.target.value }))}
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
                      onValueChange={(value: "admin" | "technician" | "observer") => 
                        setCreateUserData(prev => ({ ...prev, role: value }))
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
                    {isLoading ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleMigrateProfiles} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isLoading ? 'Migrando...' : 'Corrigir Perfis'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• <strong>Adicionar Usuário:</strong> Cria um novo usuário com email e senha</p>
            <p>• <strong>Corrigir Perfis:</strong> Cria perfis para usuários existentes sem perfil</p>
          </div>
          
          {message && (
            <div className="p-3 rounded-md bg-muted text-sm">
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User List
          </CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {initialUsers.map((user, index) => (
              <div key={user.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{user.full_name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : user.role === 'observer'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {getRoleTranslation(user.role || 'technician')}
                  </span>
                  {user.last_sign_in_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}