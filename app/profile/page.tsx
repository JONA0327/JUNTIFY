"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NewNavbar } from "@/components/new-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { User, Settings, CloudUpload, AlertCircle, Mail, Building, LogOut } from "lucide-react"
import { GoogleDriveSetup } from "@/components/google-drive-setup"
import { getUsername, storeUsername } from "@/utils/user-helpers"
import { getSupabaseClient } from "@/utils/supabase"

export default function ProfilePage() {
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
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
        // Obtener el username almacenado localmente
        const storedUsername = getUsername()
        if (storedUsername) {
          setUsername(storedUsername)
        }

        // Obtener datos del usuario desde Supabase
        const supabase = getSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setEmail(user.email || "")

          // Obtener metadatos adicionales si existen
          const metadata = user.user_metadata || {}
          setFullName(metadata.full_name || "")
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
      // Guardar username localmente
      storeUsername(username.trim())

      // Actualizar metadatos en Supabase
      const supabase = getSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      })

      if (updateError) throw updateError

      setSuccess("Perfil actualizado correctamente")
      setError(null)

      // Limpiar mensaje de éxito después de 3 segundos
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
      // Cerrar sesión en Supabase
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()

      // Limpiar datos locales
      localStorage.removeItem("juntify_username")
      localStorage.removeItem("juntify_token")

      // Redireccionar al login
      router.push("/login")
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      setError("No se pudo cerrar la sesión")
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 glow-text">Perfil de Usuario</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-blue-800/30 w-full mb-8">
              <TabsTrigger value="account" className="data-[state=active]:bg-blue-600 text-white">
                <User className="h-4 w-4 mr-2" />
                Cuenta
              </TabsTrigger>
              <TabsTrigger value="storage" className="data-[state=active]:bg-blue-600 text-white">
                <CloudUpload className="h-4 w-4 mr-2" />
                Almacenamiento
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 text-white">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="mt-0">
              <Card className="bg-blue-800/30 border border-blue-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Información de la cuenta</CardTitle>
                  <CardDescription className="text-blue-300">
                    Actualiza tu información personal y preferencias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="mt-2 text-blue-200">Cargando información...</p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    Guardar cambios
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                    onClick={() => router.push("/organization")}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Gestionar organización
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
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
            </TabsContent>

            <TabsContent value="storage" className="mt-0">
              <GoogleDriveSetup />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Card className="bg-blue-800/30 border border-blue-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Preferencias</CardTitle>
                  <CardDescription className="text-blue-300">
                    Personaliza tu experiencia en la aplicación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-200">Próximamente más opciones de configuración...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <NewNavbar />
    </div>
  )
}
