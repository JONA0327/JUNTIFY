"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Users,
  UserPlus,
  Settings,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCog,
  LogOut,
  UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getUsername } from "@/utils/user-helpers"
import { useRouter } from "next/navigation"

// Tipo para miembro de organización
interface OrganizationMember {
  id: string
  username: string
  full_name: string
  email: string
  is_admin: boolean
}

// Tipo para organización
interface Organization {
  id: string
  name: string
  code: string
}

export default function OrganizationPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState("members")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Verificar autenticación y obtener datos de la organización
  useEffect(() => {
    const storedUsername = getUsername()
    if (storedUsername) {
      setUsername(storedUsername)
      fetchOrganizationData(storedUsername)
    } else {
      setLoading(false)
      setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
    }
  }, [])

  // Obtener datos de la organización
  const fetchOrganizationData = async (username: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/organizations/me", {
        headers: {
          "X-Username": username,
        },
      })

      if (response.status === 404) {
        // El usuario no tiene organización
        setOrganization(null)
        setMembers([])
        setIsAdmin(false)
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setOrganization(data.organization)
      setMembers(data.members || [])
      setIsAdmin(data.isAdmin || false)
    } catch (err: any) {
      console.error("Error al obtener datos de la organización:", err)
      setError(err.message || "Error al cargar la información de la organización")
    } finally {
      setLoading(false)
    }
  }

  // Crear una nueva organización
  const handleCreateOrganization = async () => {
    if (!username) return
    if (!newOrgName.trim()) {
      setError("Por favor, ingresa un nombre para la organización")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Obtener el ID del usuario
      const userResponse = await fetch("/api/users/me", {
        headers: {
          "X-Username": username,
        },
      })

      if (!userResponse.ok) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      const userData = await userResponse.json()

      // Crear la organización
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          name: newOrgName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear la organización")
      }

      // Actualizar datos
      await fetchOrganizationData(username)
      setShowCreateDialog(false)
      setNewOrgName("")
    } catch (err: any) {
      console.error("Error al crear organización:", err)
      setError(err.message || "Error al crear la organización")
    } finally {
      setSubmitting(false)
    }
  }

  // Unirse a una organización existente
  const handleJoinOrganization = async () => {
    if (!username) return
    if (!joinCode.trim()) {
      setError("Por favor, ingresa un código de organización")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Verificar el código
      const verifyResponse = await fetch("/api/groups/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: joinCode.trim(),
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error("Código de organización inválido")
      }

      const orgData = await verifyResponse.json()

      // Obtener el ID del usuario
      const userResponse = await fetch("/api/users/me", {
        headers: {
          "X-Username": username,
        },
      })

      if (!userResponse.ok) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      const userData = await userResponse.json()

      // Asignar usuario a la organización
      const joinResponse = await fetch(`/api/groups/${orgData.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
        }),
      })

      if (!joinResponse.ok) {
        throw new Error("Error al unirse a la organización")
      }

      // Actualizar datos
      await fetchOrganizationData(username)
      setShowJoinDialog(false)
      setJoinCode("")
    } catch (err: any) {
      console.error("Error al unirse a la organización:", err)
      setError(err.message || "Error al unirse a la organización")
    } finally {
      setSubmitting(false)
    }
  }

  // Abandonar la organización
  const handleLeaveOrganization = async () => {
    if (!username || !organization) return

    try {
      setSubmitting(true)
      setError(null)

      // Obtener el ID del usuario
      const userResponse = await fetch("/api/users/me", {
        headers: {
          "X-Username": username,
        },
      })

      if (!userResponse.ok) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      const userData = await userResponse.json()

      // Eliminar al usuario de la organización
      const response = await fetch(`/api/groups/${organization.id}/members/${userData.id}`, {
        method: "DELETE",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Error al abandonar la organización")
      }

      // Actualizar datos
      setOrganization(null)
      setMembers([])
      setIsAdmin(false)
      setShowLeaveDialog(false)
    } catch (err: any) {
      console.error("Error al abandonar la organización:", err)
      setError(err.message || "Error al abandonar la organización")
    } finally {
      setSubmitting(false)
    }
  }

  // Eliminar un miembro de la organización
  const handleRemoveMember = async () => {
    if (!username || !organization || !selectedMember) return

    try {
      setSubmitting(true)
      setError(null)

      // Eliminar al miembro de la organización
      const response = await fetch(`/api/groups/${organization.id}/members/${selectedMember.id}`, {
        method: "DELETE",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar al miembro")
      }

      // Actualizar la lista de miembros
      setMembers(members.filter((member) => member.id !== selectedMember.id))
      setShowRemoveMemberDialog(false)
      setSelectedMember(null)
    } catch (err: any) {
      console.error("Error al eliminar miembro:", err)
      setError(err.message || "Error al eliminar al miembro")
    } finally {
      setSubmitting(false)
    }
  }

  // Promover a un miembro a administrador
  const handlePromoteMember = async () => {
    if (!username || !organization || !selectedMember) return

    try {
      setSubmitting(true)
      setError(null)

      // Promover al miembro a administrador
      const response = await fetch(`/api/groups/${organization.id}/members/${selectedMember.id}/promote`, {
        method: "PUT",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Error al promover al miembro")
      }

      // Actualizar la lista de miembros
      setMembers(members.map((member) => (member.id === selectedMember.id ? { ...member, is_admin: true } : member)))
      setShowPromoteDialog(false)
      setSelectedMember(null)
    } catch (err: any) {
      console.error("Error al promover miembro:", err)
      setError(err.message || "Error al promover al miembro")
    } finally {
      setSubmitting(false)
    }
  }

  // Copiar código de invitación
  const handleCopyCode = () => {
    if (organization) {
      navigator.clipboard.writeText(organization.code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  // Renderizar página de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Cargando información de la organización...</p>
        </div>
        <NewNavbar />
      </div>
    )
  }

  // Renderizar página de error de autenticación
  if (error && error.includes("sesión")) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col">
        <main className="container mx-auto px-4 pb-24 pt-16 flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de autenticación</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Mi Organización</h1>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sin organización */}
          {!organization && (
            <Card className="bg-blue-800/20 border-blue-700/30 mb-8">
              <CardHeader>
                <CardTitle className="text-white">No perteneces a ninguna organización</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Crea una nueva organización o únete a una existente con un código de invitación
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 flex-1" onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Crear organización
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 flex-1" onClick={() => setShowJoinDialog(true)}>
                  <Users className="h-5 w-5 mr-2" />
                  Unirse con código
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Con organización */}
          {organization && (
            <>
              {/* Información de la organización */}
              <Card className="bg-blue-800/20 border-blue-700/30 mb-8">
                <CardHeader>
                  <CardTitle className="text-white">{organization.name}</CardTitle>
                  <CardDescription className="text-blue-200/70">
                    {isAdmin ? "Eres administrador de esta organización" : "Eres miembro de esta organización"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label className="text-blue-200 mb-2 block">Código de invitación</Label>
                      <div className="flex">
                        <Input
                          value={organization.code}
                          readOnly
                          className="bg-blue-700/40 border-blue-600/50 text-white"
                        />
                        <Button className="ml-2 bg-blue-600 hover:bg-blue-700" onClick={handleCopyCode}>
                          {codeCopied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </Button>
                      </div>
                      <p className="text-xs text-blue-300/70 mt-2">
                        Comparte este código con las personas que quieras invitar a tu organización
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        onClick={() => setShowLeaveDialog(true)}
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        {isAdmin ? "Disolver organización" : "Abandonar organización"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pestañas */}
              <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-blue-800/30">
                  <TabsTrigger value="members" className="data-[state=active]:bg-blue-600">
                    <Users className="h-5 w-5 mr-2" />
                    Miembros
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
                    <Settings className="h-5 w-5 mr-2" />
                    Configuración
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña de miembros */}
                <TabsContent value="members" className="mt-0">
                  <Card className="bg-blue-800/20 border-blue-700/30">
                    <CardHeader>
                      <CardTitle className="text-white">Miembros de la organización</CardTitle>
                      <CardDescription className="text-blue-200/70">
                        {members.length} {members.length === 1 ? "miembro" : "miembros"} en la organización
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {members.length > 0 ? (
                        <div className="space-y-4">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="p-4 rounded-lg bg-blue-800/30 border border-blue-700/30 flex justify-between items-center"
                            >
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium text-white">{member.full_name}</span>
                                  {member.is_admin && (
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-blue-200/70">@{member.username}</div>
                                <div className="text-xs text-blue-300/50">{member.email}</div>
                              </div>
                              {isAdmin && member.username !== username && (
                                <div className="flex gap-2">
                                  {!member.is_admin && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
                                      onClick={() => {
                                        setSelectedMember(member)
                                        setShowPromoteDialog(true)
                                      }}
                                    >
                                      <UserCog className="h-4 w-4 mr-1" />
                                      Promover
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                                    onClick={() => {
                                      setSelectedMember(member)
                                      setShowRemoveMemberDialog(true)
                                    }}
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-blue-200">No hay miembros en la organización</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pestaña de configuración */}
                <TabsContent value="settings" className="mt-0">
                  <Card className="bg-blue-800/20 border-blue-700/30">
                    <CardHeader>
                      <CardTitle className="text-white">Configuración de la organización</CardTitle>
                      <CardDescription className="text-blue-200/70">
                        Administra la configuración de tu organización
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-blue-200 mb-2 block">Nombre de la organización</Label>
                          <div className="flex">
                            <Input
                              value={organization.name}
                              readOnly={!isAdmin}
                              className="bg-blue-700/40 border-blue-600/50 text-white"
                            />
                            {isAdmin && <Button className="ml-2 bg-blue-600 hover:bg-blue-700">Guardar</Button>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>

      {/* Diálogo para crear organización */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Crear nueva organización</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Crea una nueva organización y conviértete en su administrador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nombre de la organización</Label>
              <Input
                id="org-name"
                placeholder="Ingresa un nombre para tu organización"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrganization}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || !newOrgName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>Crear organización</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para unirse a organización */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Unirse a una organización</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Ingresa el código de invitación para unirte a una organización existente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Código de invitación</Label>
              <Input
                id="join-code"
                placeholder="Ingresa el código de invitación"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowJoinDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleJoinOrganization}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || !joinCode.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uniéndose...
                </>
              ) : (
                <>Unirse</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para abandonar organización */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>{isAdmin ? "Disolver organización" : "Abandonar organización"}</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              {isAdmin
                ? "Esta acción eliminará la organización y todos sus miembros serán desvinculados"
                : "Esta acción te desvinculará de la organización"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Advertencia</AlertTitle>
              <AlertDescription>
                {isAdmin
                  ? "Esta acción no se puede deshacer. ¿Estás seguro de que deseas disolver la organización?"
                  : "Esta acción no se puede deshacer. ¿Estás seguro de que deseas abandonar la organización?"}
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLeaveOrganization} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>{isAdmin ? "Disolver organización" : "Abandonar organización"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar miembro */}
      <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar miembro</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Esta acción eliminará al miembro de la organización
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMember && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  ¿Estás seguro de que deseas eliminar a {selectedMember.full_name} de la organización?
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveMemberDialog(false)
                setSelectedMember(null)
              }}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>Eliminar miembro</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para promover miembro */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Promover a administrador</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Esta acción convertirá al miembro en administrador de la organización
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMember && (
              <Alert className="bg-blue-900/50 border-blue-700 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Confirmación</AlertTitle>
                <AlertDescription>
                  ¿Estás seguro de que deseas promover a {selectedMember.full_name} como administrador? Los
                  administradores pueden gestionar miembros y configurar la organización.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPromoteDialog(false)
                setSelectedMember(null)
              }}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button onClick={handlePromoteMember} className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Promoviendo...
                </>
              ) : (
                <>Promover a administrador</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NewNavbar />
    </div>
  )
}
