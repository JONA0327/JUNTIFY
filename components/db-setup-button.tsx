"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, AlertCircle, Database } from "lucide-react"

interface DbSetupButtonProps {
  tableName: string
  setupEndpoint: string
  buttonText: string
  successMessage: string
}

export function DbSetupButton({ tableName, setupEndpoint, buttonText, successMessage }: DbSetupButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const handleSetup = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      setDebugInfo(null)

      console.log(`Configurando tabla ${tableName}...`)
      const response = await fetch(setupEndpoint)
      const data = await response.json()

      if (response.ok) {
        console.log(`Tabla ${tableName} configurada correctamente:`, data)
        setSuccess(successMessage || `Tabla ${tableName} configurada correctamente`)
      } else {
        console.error(`Error al configurar tabla ${tableName}:`, data)
        setError(`Error al configurar tabla ${tableName}`)
        setDebugInfo(data.details || JSON.stringify(data))
      }
    } catch (err) {
      console.error(`Error al configurar tabla ${tableName}:`, err)
      setError(`Error al configurar tabla ${tableName}`)
      setDebugInfo(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {debugInfo && (
            <div className="mt-2 p-2 bg-red-950 rounded text-xs overflow-auto max-h-32">
              <pre>{debugInfo}</pre>
            </div>
          )}
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900/50 border-green-800 text-white">
          <Check className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSetup}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
      >
        <Database className="h-4 w-4" />
        {isLoading ? "Configurando..." : buttonText || `Configurar tabla ${tableName}`}
      </Button>
    </div>
  )
}
