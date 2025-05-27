"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, AlertCircle } from "lucide-react"

export default function DebugPage() {
  const [username, setUsername] = useState("")
  const [storedUsername, setStoredUsername] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storageItems, setStorageItems] = useState<Record<string, string>>({})

  useEffect(() => {
    // Cargar el nombre de usuario almacenado
    try {
      const stored = localStorage.getItem("juntify_username")
      setStoredUsername(stored)
      console.log("Username retrieved from localStorage:", stored)
    } catch (err) {
      console.error("Error retrieving username from localStorage:", err)
      setError("Error al recuperar el nombre de usuario: " + String(err))
    }

    // Cargar todos los elementos de localStorage
    try {
      const items: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          items[key] = localStorage.getItem(key) || ""
        }
      }
      setStorageItems(items)
    } catch (err) {
      console.error("Error loading localStorage items:", err)
      setError("Error al cargar elementos de localStorage: " + String(err))
    }
  }, [])

  const handleSaveUsername = () => {
    if (!username.trim()) {
      setError("El nombre de usuario no puede estar vacío")
      return
    }

    try {
      localStorage.setItem("juntify_username", username.trim())
      setStoredUsername(username.trim())
      setSuccess("Nombre de usuario guardado correctamente")
      setError(null)

      // Actualizar la lista de elementos
      const items = { ...storageItems }
      items["juntify_username"] = username.trim()
      setStorageItems(items)

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error saving username to localStorage:", err)
      setError("Error al guardar el nombre de usuario: " + String(err))
    }
  }

  const handleClearStorage = () => {
    try {
      localStorage.clear()
      setStoredUsername(null)
      setStorageItems({})
      setSuccess("localStorage limpiado correctamente")
      setError(null)

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error clearing localStorage:", err)
      setError("Error al limpiar localStorage: " + String(err))
    }
  }

  const handleTestCookies = () => {
    try {
      document.cookie = `test_cookie=test_value; path=/; max-age=3600; SameSite=Strict`
      setSuccess("Cookie de prueba creada correctamente")
      setError(null)

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error creating test cookie:", err)
      setError("Error al crear cookie de prueba: " + String(err))
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Página de Depuración</h1>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-blue-800/30 border border-blue-700/30">
            <CardHeader>
              <CardTitle className="text-white">Nombre de Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-username" className="text-blue-200">
                  Nombre de usuario actual
                </Label>
                <Input
                  id="current-username"
                  value={storedUsername || ""}
                  disabled
                  className="bg-blue-700/40 border border-blue-600/50 text-white"
                />
                <p className="text-xs text-blue-300/70">
                  {storedUsername
                    ? "Nombre de usuario encontrado en localStorage"
                    : "No se encontró nombre de usuario en localStorage"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-username" className="text-blue-200">
                  Establecer nuevo nombre de usuario
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-blue-700/40 border border-blue-600/50 text-white"
                  />
                  <Button onClick={handleSaveUsername} className="bg-blue-600">
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-800/30 border border-blue-700/30">
            <CardHeader>
              <CardTitle className="text-white">localStorage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-blue-200">Elementos en localStorage</Label>
                <div className="bg-blue-700/40 border border-blue-600/50 p-3 rounded text-xs text-white overflow-auto max-h-48">
                  <pre>{JSON.stringify(storageItems, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={handleClearStorage}>
                Limpiar localStorage
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-blue-800/30 border border-blue-700/30 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Pruebas Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-blue-200">Prueba de Cookies</Label>
                <p className="text-xs text-blue-300/70">
                  Crea una cookie de prueba para verificar si el navegador permite cookies
                </p>
                <Button onClick={handleTestCookies} className="bg-purple-600">
                  Crear Cookie de Prueba
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-blue-200">Enlaces Útiles</Label>
                <div className="flex flex-wrap gap-2">
                  <a href="/profile" className="text-blue-300 hover:text-blue-100 underline">
                    Ir a Perfil
                  </a>
                  <span className="text-blue-500">|</span>
                  <a href="/api/db-setup/google-tokens" className="text-blue-300 hover:text-blue-100 underline">
                    Crear Tabla Google Tokens
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
