"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, AlertCircle, CloudUpload, Database, Folder, Plus } from "lucide-react"
import { getUsername } from "@/utils/user-helpers"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GoogleDriveSetup() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [manualUsername, setManualUsername] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [tableCreated, setTableCreated] = useState(false)
  const [folderUrl, setFolderUrl] = useState("")
  const [folderName, setFolderName] = useState("Juntify Recordings")
  const [isSavingFolder, setIsSavingFolder] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [folderSaved, setFolderSaved] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar si hay un error de base de datos en los parámetros de la URL
    const errorParam = searchParams.get("error")
    const detailsParam = searchParams.get("details")
    const successParam = searchParams.get("success")

    if (successParam === "connected") {
      setSuccess("Conexión con Google Drive establecida correctamente")
    }

    if (errorParam === "db_error" && detailsParam && detailsParam.includes("google_tokens")) {
      // Intentar crear la tabla automáticamente
      createGoogleTokensTable()
    } else if (errorParam === "no_user") {
      // Mostrar entrada manual para el nombre de usuario
      setShowManualInput(true)
      setError("No se pudo recuperar el nombre de usuario")
      setDebugInfo(detailsParam || "Se requiere el nombre de usuario para conectar con Google Drive")
      setIsLoading(false)
    } else {
      // Continuar con la carga normal
      loadUserData()
    }
  }, [searchParams])

  const loadUserData = async () => {
    // Obtener el nombre de usuario
    const storedUsername = getUsername()
    console.log("Nombre de usuario obtenido:", storedUsername)

    if (!storedUsername) {
      console.log("No se encontró nombre de usuario en localStorage")
      setError("Debes iniciar sesión para conectar con Google Drive")
      setShowManualInput(true)
      setIsLoading(false)
      return
    }

    setUsername(storedUsername)

    // Verificar si el usuario ya está conectado a Google Drive
    checkConnectionForUser(storedUsername)
  }

  const createGoogleTokensTable = async () => {
    try {
      setIsCreatingTable(true)
      setError(null)
      setDebugInfo(null)

      console.log("Creando tabla google_tokens...")
      const response = await fetch("/api/db-setup/create-google-tokens")
      const data = await response.json()

      if (response.ok) {
        console.log("Tabla google_tokens creada correctamente:", data)
        setTableCreated(true)
        setSuccess("Tabla de tokens creada correctamente. Ahora puedes conectar con Google Drive.")

        // Cargar datos del usuario después de crear la tabla
        loadUserData()
      } else {
        console.error("Error al crear tabla google_tokens:", data)
        setError("Error al crear tabla para tokens de Google Drive")
        setDebugInfo(data.details || JSON.stringify(data))
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error al crear tabla google_tokens:", err)
      setError("Error al crear tabla para tokens de Google Drive")
      setDebugInfo(String(err))
      setIsLoading(false)
    } finally {
      setIsCreatingTable(false)
    }
  }

  const checkConnectionForUser = async (user: string) => {
    try {
      console.log("Verificando conexión para el usuario:", user)
      const response = await fetch("/api/auth/google/status", {
        headers: {
        },
      })

      const data = await response.json()
      console.log("Respuesta de verificación de conexión:", data)

      // Si hay un error de base de datos, intentar crear la tabla
      if (data.error && data.details && data.details.includes("google_tokens")) {
        createGoogleTokensTable()
        return
      }

      setIsConnected(data.connected)

      // Si está conectado, verificar si tiene una carpeta configurada
      if (data.connected && data.recordings_folder_id) {
        setCurrentFolderId(data.recordings_folder_id)
        setFolderSaved(true)
      }
    } catch (err) {
      console.error("Error al verificar conexión con Google Drive:", err)
      setError("Error al verificar conexión con Google Drive")
      setDebugInfo(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetManualUsername = () => {
    if (!manualUsername.trim()) {
      setError("El nombre de usuario no puede estar vacío")
      return
    }

    try {
      // Guardar en localStorage
      localStorage.setItem("juntify_username", manualUsername.trim())
      setUsername(manualUsername.trim())
      setShowManualInput(false)
      setError(null)
      setSuccess("Nombre de usuario establecido correctamente")

      // Verificar conexión con el nuevo nombre de usuario
      checkConnectionForUser(manualUsername.trim())
    } catch (err) {
      console.error("Error al guardar nombre de usuario:", err)
      setError("Error al guardar nombre de usuario")
      setDebugInfo(String(err))
    }
  }

  const handleConnect = async () => {
    try {
      if (!username) {
        setError("Debes iniciar sesión para conectar con Google Drive")
        setShowManualInput(true)
        return
      }

      setIsLoading(true)
      setError(null)
      setDebugInfo(null)

      console.log("Iniciando conexión con Google Drive para el usuario:", username)

      // Guardar el nombre de usuario en localStorage y sessionStorage
      try {
        localStorage.setItem("connecting_username", username)
        sessionStorage.setItem("connecting_username", username)

        // También crear una cookie para mayor seguridad
        document.cookie = `connecting_username=${encodeURIComponent(username)}; path=/; max-age=3600; SameSite=Lax`

        console.log("Nombre de usuario guardado para el callback:", username)
      } catch (storageError) {
        console.warn("Error al guardar nombre de usuario en storage:", storageError)
      }

      const response = await fetch(`/api/auth/google?username=${encodeURIComponent(username)}`, {
        headers: {
        },
      })
      const data = await response.json()

      if (data.authUrl) {
        console.log("Redirigiendo a:", data.authUrl)
        window.location.href = data.authUrl
      } else {
        setError(data.error || "No se pudo generar la URL de autenticación")
        if (data.details) {
          setDebugInfo(data.details)
        }
      }
    } catch (err) {
      console.error("Error al iniciar conexión con Google Drive:", err)
      setError("Error al conectar con Google Drive")
      setDebugInfo(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (!username) {
        setError("Debes iniciar sesión para desconectar Google Drive")
        return
      }

      setIsLoading(true)
      setError(null)
      setDebugInfo(null)

      console.log("Desconectando Google Drive para el usuario:", username)
      const response = await fetch("/api/auth/google/disconnect", {
        method: "POST",
        headers: {
        },
      })

      if (response.ok) {
        setIsConnected(false)
        setFolderSaved(false)
        setCurrentFolderId(null)
        setSuccess("Desconexión de Google Drive realizada correctamente")
      } else {
        const data = await response.json()
        setError(data.error || "Error al desconectar Google Drive")
        if (data.details) {
          setDebugInfo(data.details)
        }
      }
    } catch (err) {
      console.error("Error al desconectar Google Drive:", err)
      setError("Error al desconectar Google Drive")
      setDebugInfo(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTable = () => {
    createGoogleTokensTable()
  }

  // Extraer el ID de carpeta de la URL de Google Drive
  const extractFolderId = (url: string): string | null => {
    try {
      // Patrones comunes de URL de carpeta de Google Drive
      const patterns = [
        /drive\.google\.com\/drive\/folders\/([^?&#/]+)/i, // URL normal de carpeta
        /drive\.google\.com\/drive\/u\/\d+\/folders\/([^?&#/]+)/i, // URL con cuenta específica
        /drive\.google\.com\/open\?id=([^?&#/]+)/i, // URL de compartir
        /drive\.google\.com\/file\/d\/([^?&#/]+)/i, // URL de archivo (por si acaso)
        /id=([^?&#/]+)/i, // Parámetro id en la URL
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }

      return null
    } catch (error) {
      console.error("Error al extraer ID de carpeta:", error)
      return null
    }
  }

  const handleSaveFolder = async () => {
    if (!username) {
      setError("Debes iniciar sesión para guardar la carpeta")
      return
    }

    if (!folderUrl.trim()) {
      setError("La URL de la carpeta no puede estar vacía")
      return
    }

    const folderId = extractFolderId(folderUrl)
    if (!folderId) {
      setError("No se pudo extraer el ID de carpeta de la URL proporcionada")
      return
    }

    try {
      setIsSavingFolder(true)
      setError(null)
      setDebugInfo(null)

      console.log("Guardando ID de carpeta:", folderId)
      const response = await fetch("/api/auth/google/save-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId }),
      })

      const data = await response.json()

      if (response.ok) {
        setFolderSaved(true)
        setCurrentFolderId(folderId)
        setSuccess("Carpeta de grabaciones guardada correctamente")
        setFolderUrl("")
      } else {
        setError(data.error || "Error al guardar la carpeta")
        if (data.details) {
          setDebugInfo(data.details)
        }
      }
    } catch (err) {
      console.error("Error al guardar carpeta:", err)
      setError("Error al guardar la carpeta")
      setDebugInfo(String(err))
    } finally {
      setIsSavingFolder(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!username) {
      setError("Debes iniciar sesión para crear una carpeta")
      return
    }

    if (!folderName.trim()) {
      setError("El nombre de la carpeta no puede estar vacío")
      return
    }

    try {
      setIsCreatingFolder(true)
      setError(null)
      setDebugInfo(null)
      setSuccess(null)

      console.log("Creando carpeta:", folderName)
      const response = await fetch("/api/google-drive/create-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName }),
      })

      const data = await response.json()

      if (response.ok && data.folderId) {
        setFolderSaved(true)
        setCurrentFolderId(data.folderId)
        setSuccess(`Carpeta "${folderName}" creada y configurada correctamente`)
        setShowCreateFolder(false)
      } else {
        setError(data.error || "Error al crear la carpeta")
        if (data.details) {
          setDebugInfo(data.details)
        }
      }
    } catch (err) {
      console.error("Error al crear carpeta:", err)
      setError("Error al crear la carpeta")
      setDebugInfo(String(err))
    } finally {
      setIsCreatingFolder(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-blue-800/30 border border-blue-700/30">
      <CardHeader>
        <CardTitle className="text-white">Configuración de Google Drive</CardTitle>
        <CardDescription className="text-blue-300">
          Conecta tu cuenta de Google Drive para almacenar tus archivos de audio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || isCreatingTable || isSavingFolder || isCreatingFolder ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-blue-300">
              {isCreatingTable
                ? "Creando tabla..."
                : isSavingFolder
                  ? "Guardando carpeta..."
                  : isCreatingFolder
                    ? "Creando carpeta..."
                    : "Cargando..."}
            </p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                {debugInfo && (
                  <div className="mt-2 p-2 bg-red-950 rounded text-xs overflow-auto max-h-32">
                    <pre>{debugInfo}</pre>
                  </div>
                )}
                {debugInfo && debugInfo.includes("google_tokens") && !tableCreated && (
                  <Button onClick={handleCreateTable} className="mt-2 bg-blue-600">
                    <Database className="h-4 w-4 mr-2" />
                    Crear tabla de tokens
                  </Button>
                )}
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-900/50 border-green-800 text-white">
                <Check className="h-4 w-4" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {tableCreated && (
              <Alert className="mb-4 bg-blue-900/50 border-blue-700 text-white">
                <Database className="h-4 w-4" />
                <AlertTitle>Tabla creada</AlertTitle>
                <AlertDescription>
                  La tabla para tokens de Google Drive ha sido creada correctamente. Ahora puedes conectar con Google
                  Drive.
                </AlertDescription>
              </Alert>
            )}

            {showManualInput ? (
              <div className="mb-4 p-4 bg-blue-700/20 rounded-lg">
                <Label htmlFor="manual-username" className="text-sm font-medium text-white mb-2 block">
                  Introduce tu nombre de usuario
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-username"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    className="bg-blue-700/40 border border-blue-600/50 text-white"
                    placeholder="Nombre de usuario"
                  />
                  <Button onClick={handleSetManualUsername} className="bg-blue-600">
                    Guardar
                  </Button>
                </div>
                <p className="text-xs text-blue-300 mt-2">
                  Necesitamos tu nombre de usuario para conectar con Google Drive
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-blue-700/20 rounded-lg mb-4">
                  <div className="flex items-center">
                    <CloudUpload className="h-6 w-6 mr-3 text-blue-400" />
                    <div>
                      <h3 className="text-sm font-medium text-white">Google Drive</h3>
                      <p className="text-xs text-blue-300">{isConnected ? "Conectado" : "No conectado"}</p>
                      {username && <p className="text-xs text-blue-300/70">Usuario: {username}</p>}
                    </div>
                  </div>

                  <Button
                    variant={isConnected ? "outline" : "default"}
                    size="sm"
                    onClick={isConnected ? handleDisconnect : handleConnect}
                    className={isConnected ? "border-blue-600/50 text-blue-300" : "bg-blue-600"}
                  >
                    {isConnected ? "Desconectar" : "Conectar"}
                  </Button>
                </div>

                {isConnected && (
                  <div className="p-4 bg-blue-700/20 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Folder className="h-5 w-5 mr-2 text-blue-400" />
                      <h3 className="text-sm font-medium text-white">Carpeta de grabaciones</h3>
                    </div>

                    {folderSaved && currentFolderId ? (
                      <div className="mb-3">
                        <p className="text-xs text-blue-300 mb-1">Carpeta configurada:</p>
                        <div className="p-2 bg-blue-800/50 rounded text-xs text-blue-200 break-all">
                          ID: {currentFolderId}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-blue-600/50 text-blue-300"
                          onClick={() => setFolderSaved(false)}
                        >
                          Cambiar carpeta
                        </Button>
                      </div>
                    ) : showCreateFolder ? (
                      <div className="space-y-2">
                        <Label htmlFor="folder-name" className="text-xs text-blue-300">
                          Nombre de la carpeta:
                        </Label>
                        <Input
                          id="folder-name"
                          value={folderName}
                          onChange={(e) => setFolderName(e.target.value)}
                          className="bg-blue-700/40 border border-blue-600/50 text-white text-sm"
                          placeholder="Juntify Recordings"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={handleCreateFolder}
                            className="flex-1 bg-blue-600"
                            disabled={!folderName.trim()}
                          >
                            Crear carpeta
                          </Button>
                          <Button
                            variant="outline"
                            className="border-blue-600/50 text-blue-300"
                            onClick={() => setShowCreateFolder(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                        <p className="text-xs text-blue-300/70 mt-1">
                          Se creará una carpeta compartida con Juntify para almacenar tus grabaciones.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-blue-300 mb-2">
                          Introduce la URL de tu carpeta de Google Drive o crea una nueva:
                        </p>
                        <div className="space-y-2">
                          <Input
                            value={folderUrl}
                            onChange={(e) => setFolderUrl(e.target.value)}
                            className="bg-blue-700/40 border border-blue-600/50 text-white text-sm"
                            placeholder="https://drive.google.com/drive/folders/tu-id-de-carpeta"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveFolder}
                              className="flex-1 bg-blue-600"
                              disabled={!folderUrl.trim()}
                            >
                              Usar carpeta existente
                            </Button>
                            <Button
                              onClick={() => setShowCreateFolder(true)}
                              className="bg-green-600"
                              title="Crear nueva carpeta"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-blue-300/70 mt-2">
                          Esto permitirá que tus grabaciones se guarden directamente en tu carpeta de Google Drive.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-blue-300/70">
        <p>
          Al conectar tu cuenta de Google Drive y configurar tu carpeta de grabaciones, podrás acceder a tus archivos de
          audio desde cualquier dispositivo.
        </p>
      </CardFooter>
    </Card>
  )
}
