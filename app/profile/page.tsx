"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NewNavbar } from "@/components/new-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  User, Settings, CloudUpload, AlertCircle, Mail, LogOut,
  Award, Gem, Crown, Star, Shield, Code, UserCog, ChevronRight, History
} from "lucide-react"
import { GoogleDriveSetup } from "@/components/google-drive-setup"
import { getUsername, storeUsername } from "@/utils/user-helpers"
import { getSupabaseClient } from "@/utils/supabase"
import { UserBadge } from "@/components/user-badge"

const roleInfo: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  free: {
    label: "Free",
    // #F4E8F8 (muy claro) → texto oscuro
    color: "bg-[#F4E8F8] text-gray-900 border-[#F4E8F8]",
    icon: <Award className="h-4 w-4 mr-1 text-gray-700" />,
  },
  basic: {
    label: "Basic",
    // #D2D9E6 (claro) → texto oscuro
    color: "bg-[#D2D9E6] text-gray-900 border-[#D2D9E6]",
    icon: <Star className="h-4 w-4 mr-1 text-gray-700" />,
  },
  business: {
    label: "Business",
    // #93E1D8 (claro) → texto oscuro
    color: "bg-[#93E1D8] text-gray-900 border-[#93E1D8]",
    icon: <Crown className="h-4 w-4 mr-1 text-gray-700" />,
  },
  enterprise: {
    label: "Enterprise",
    // #61A9C2 (medio-oscuro) → texto blanco
    color: "bg-[#61A9C2] text-white border-[#61A9C2]",
    icon: <Gem className="h-4 w-4 mr-1 text-white" />,
  },
  founder: {
    label: "Founder",
    // #6E2A84 (oscuro) → texto blanco
    color: "bg-[#6E2A84] text-white border-[#6E2A84]",
    icon: <Shield className="h-4 w-4 mr-1 text-white" />,
  },
  developer: {
    label: "Developer",
    // #3F826D (muy oscuro) → texto blanco
    color: "bg-[#3F826D] text-white border-[#3F826D]",
    icon: <Code className="h-4 w-4 mr-1 text-white" />,
  },
  superadmin: {
    label: "Superadmin",
    // #00916E (oscuro) → texto blanco
    color: "bg-[#00916E] text-white border-[#00916E]",
    icon: <UserCog className="h-4 w-4 mr-1 text-white" />,
  },
};

const sidebarItems = [
  { id: "account", label: "Mi Cuenta", icon: User },
  { id: "storage", label: "Almacenamiento", icon: CloudUpload },
  { id: "settings", label: "Configuración", icon: Settings },
  { id: "changes", label: "Cambios", icon: History },
]

export default function ProfilePage() {
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("free")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("account")
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const storedUsername = getUsername()
        if (storedUsername) {
          setUsername(storedUsername)
        }

        const supabase = getSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setEmail(user.email || "")
          const metadata = user.user_metadata || {}
          setFullName(metadata.full_name || "")

          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
          setRole(profile?.role)
          console.log("Perfil obtenido:", profile)
          console.log("Rol obtenido:", profile?.role)
        }
      } catch (err) {
        console.error("Error al cargar datos del usuario:", err)
        setError("No se pudieron cargar los datos del usuario")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError("El nombre completo no puede estar vacío")
      return
    }

    try {
      storeUsername(username.trim())
      const supabase = getSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      })

      if (updateError) throw updateError

      setSuccess("Perfil actualizado correctamente")
      setError(null)

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error al actualizar perfil:", err)
      setError("No se pudo actualizar el perfil")
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()

      localStorage.removeItem("juntify_username")
      localStorage.removeItem("juntify_token")

      router.push("/login")
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      setError("No se pudo cerrar la sesión")
      setLoggingOut(false)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Información de la cuenta</h2>
              <p className="text-blue-300">Actualiza tu información personal y preferencias</p>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-900/50 border-green-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-blue-200">Cargando información...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Tarjeta de información del usuario */}
                <Card className="bg-blue-800/30 border border-blue-700/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Información Personal
                      <UserBadge type={role} size={120} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-blue-200 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Nombre de usuario
                        </Label>
                        <Input
                          id="username"
                          value={username}
                          disabled
                          className="bg-blue-700/40 border border-blue-600/50 text-white opacity-70"
                        />
                        <p className="text-xs text-blue-300/70">El nombre de usuario no se puede modificar</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-blue-200 flex items-center">
                          Rol
                        </Label>
                        <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-semibold shadow-lg ${roleInfo[role]?.color || roleInfo["free"].color}`}>
                          {roleInfo[role]?.icon }
                          {roleInfo[role]?.label }
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-blue-200 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Nombre completo
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-blue-700/40 border border-blue-600/50 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-blue-200 flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Correo electrónico
                        </Label>
                        <Input
                          id="email"
                          value={email}
                          disabled
                          className="bg-blue-700/40 border border-blue-600/50 text-white opacity-70"
                        />
                        <p className="text-xs text-blue-300/70">El correo electrónico no se puede modificar</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-4">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      Guardar cambios
                    </Button>
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      {loggingOut ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cerrando sesión...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar sesión
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        )

      case "storage":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Almacenamiento</h2>
              <p className="text-blue-300">Configura tu almacenamiento en la nube</p>
            </div>
            <GoogleDriveSetup />
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Configuración</h2>
              <p className="text-blue-300">Personaliza tu experiencia en la aplicación</p>
            </div>
            <Card className="bg-blue-800/30 border border-blue-700/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Preferencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200">Próximamente más opciones de configuración...</p>
              </CardContent>
            </Card>
          </div>
        )

      case "changes":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Cambios de la versión 0.1.1</h2>
              <p className="text-blue-300">Resumen de las novedades más recientes</p>
            </div>
            <Card className="bg-blue-800/30 border border-blue-700/30">
              <CardContent className="text-blue-200 space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Se implementó un calendario global en la vista de tareas para visualizar tareas en proceso, pendientes, completadas y vencidas.</li>
                  <li>Al seleccionar una tarea se abre la conversación asociada con un calendario exclusivo para esa reunión.</li>
                  <li>En el asistente virtual ahora se pueden crear contenedores de conversaciones para mantener el contexto.</li>
                  <li>Se añadió un buscador de conversaciones dentro de los contenedores y la opción para agregar o eliminar conversaciones.</li>
                </ul>
                <p className="text-yellow-300 mt-4">Nota: Actualmente la aplicación se encuentra en fase beta, si detectas algún error repórtalo en el botón amarillo de sugerencias.</p>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 glow-text">Perfil de Usuario</h1>
            <p className="text-blue-300">Gestiona tu cuenta y preferencias</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-blue-800/30 border border-blue-700/30 sticky top-8 flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                  <nav className="space-y-1 flex-1">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200 ${
                            isActive
                              ? "bg-blue-600/50 text-white border-r-2 border-blue-400"
                              : "text-blue-200 hover:bg-blue-700/30 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-3" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="h-4 w-4" />}
                        </button>
                      )
                    })}
                  </nav>
                  {/* Versión al final, centrada */}
                  <div className="mt-auto py-4 flex justify-center">
                    <span className="text-xs text-blue-300 font-mono text-center opacity-80">
                      Juntify v0.1.1
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="min-h-[600px]">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <NewNavbar />
    </div>
  )
}
