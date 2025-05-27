"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, AlertCircle, Key, Mail, Database } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GoogleDriveCredentials() {
  const [clientEmail, setClientEmail] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [folderId, setFolderId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [credentialStatus, setCredentialStatus] = useState<{
    clientEmail: boolean
    privateKey: boolean
    folderId: boolean
  }>({
    clientEmail: false,
    privateKey: false,
    folderId: false,
  })

  useEffect(() => {
    // Verificar estado actual de las credenciales al cargar
    checkCredentialStatus()
  }, [])

  const checkCredentialStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/google-drive/check-credentials")
      const data = await response.json()

      if (response.ok) {
        setCredentialStatus({
          clientEmail: data.credentials.clientEmail,
          privateKey: data.credentials.privateKey,
          folderId: data.credentials.folderId,
        })

        if (data.credentials.clientEmail && data.credentials.privateKey) {
          setSuccess("Credenciales de Google Drive configuradas correctamente")
        } else {
          setError("Faltan algunas credenciales de Google Drive")
        }
      } else {
        setError(data.error || "Error al verificar credenciales")
      }
    } catch (err) {
      console.error("Error al verificar estado de credenciales:", err)
      setError("Error al verificar estado de credenciales")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCredentials = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      // Validar campos
      if (!clientEmail.includes("@") || !clientEmail.includes(".")) {
        setError("El email del cliente no parece válido")
        setIsLoading(false)
        return
      }

      if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
        setError("La clave privada no tiene el formato correcto")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/google-drive/save-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientEmail,
          privateKey,
          folderId: folderId || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Credenciales guardadas correctamente")
        checkCredentialStatus() // Actualizar estado
      } else {
        setError(data.error || "Error al guardar credenciales")
      }
    } catch (err) {
      console.error("Error al guardar credenciales:", err)
      setError("Error al guardar credenciales")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/google-drive/test-connection")
      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`Conexión exitosa con Google Drive. Carpetas encontradas: ${data.folderCount}`)
      } else {
        setError(data.error || "Error al conectar con Google Drive")
      }
    } catch (err) {
      console.error("Error al probar conexión:", err)
      setError("Error al probar conexión con Google Drive")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-blue-800/30 border border-blue-700/30">
      <CardHeader>
        <CardTitle className="text-white">Credenciales de Google Drive</CardTitle>
        <CardDescription className="text-blue-300">
          Configura las credenciales de cuenta de servicio para Google Drive
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-blue-300">Procesando...</p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-900/50 border-green-800 text-white">
                <Check className="h-4 w-4" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Estado actual de las credenciales */}
              <div className="p-3 bg-blue-900/30 rounded-md mb-4">
                <h3 className="text-sm font-medium text-white mb-2">Estado de credenciales</h3>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span
                      className={`w-2 h-2 mr-2 rounded-full ${credentialStatus.clientEmail ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    <span className="text-xs text-blue-200">Email de cliente</span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`w-2 h-2 mr-2 rounded-full ${credentialStatus.privateKey ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    <span className="text-xs text-blue-200">Clave privada</span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`w-2 h-2 mr-2 rounded-full ${credentialStatus.folderId ? "bg-green-500" : "bg-amber-500"}`}
                    ></span>
                    <span className="text-xs text-blue-200">ID de carpeta (opcional)</span>
                  </div>
                </div>
              </div>

              {/* Formulario de configuración */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="client-email" className="text-sm font-medium text-white">
                    Email del cliente
                  </Label>
                  <div className="flex items-center mt-1 relative">
                    <Mail className="h-4 w-4 text-blue-400 absolute left-3" />
                    <Input
                      id="client-email"
                      placeholder="ejemplo@proyecto.iam.gserviceaccount.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="bg-blue-700/40 border border-blue-600/50 text-white pl-9"
                    />
                  </div>
                  <p className="text-xs text-blue-300 mt-1">Email de la cuenta de servicio de Google</p>
                </div>

                <div>
                  <Label htmlFor="private-key" className="text-sm font-medium text-white">
                    Clave privada
                  </Label>
                  <div className="relative mt-1">
                    <Key className="h-4 w-4 text-blue-400 absolute left-3 top-3" />
                    <Textarea
                      id="private-key"
                      placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className="bg-blue-700/40 border border-blue-600/50 text-white min-h-[100px] pl-9"
                    />
                  </div>
                  <p className="text-xs text-blue-300 mt-1">
                    Clave privada en formato PEM (incluyendo BEGIN/END PRIVATE KEY)
                  </p>
                </div>

                <div>
                  <Label htmlFor="folder-id" className="text-sm font-medium text-white">
                    ID de carpeta raíz (opcional)
                  </Label>
                  <div className="flex items-center mt-1 relative">
                    <Database className="h-4 w-4 text-blue-400 absolute left-3" />
                    <Input
                      id="folder-id"
                      placeholder="ID de carpeta raíz de Google Drive"
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                      className="bg-blue-700/40 border border-blue-600/50 text-white pl-9"
                    />
                  </div>
                  <p className="text-xs text-blue-300 mt-1">
                    ID de la carpeta donde se guardarán los archivos (opcional)
                  </p>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button onClick={handleSaveCredentials} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Guardar credenciales
                </Button>
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  className="flex-1 border-blue-600 text-blue-300"
                >
                  Probar conexión
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-blue-300/70">
        <p>
          Las credenciales de Google Drive se almacenan de forma segura en tus variables de entorno. Para obtener estas
          credenciales, necesitas crear una cuenta de servicio en Google Cloud Console.
        </p>
      </CardFooter>
    </Card>
  )
}
