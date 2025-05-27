"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import { NewNavbar } from "@/components/new-navbar"

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
    details?: any
    timestamp?: string
  }>({
    status: "idle",
    message: "No se ha ejecutado ninguna prueba",
  })

  const [connectionInfo, setConnectionInfo] = useState<{
    host?: string
    database?: string
    user?: string
    connected: boolean
    error?: string
  }>({
    connected: false,
  })

  const [tableStatus, setTableStatus] = useState<
    Array<{
      name: string
      exists: boolean
      count?: number
      error?: string
    }>
  >([])

  const runDatabaseTest = async () => {
    setTestResults({
      status: "loading",
      message: "Ejecutando pruebas de conexión a la base de datos...",
    })

    try {
      const response = await fetch("/api/db-test")
      const data = await response.json()

      if (response.ok) {
        setTestResults({
          status: "success",
          message: "Conexión exitosa a la base de datos",
          details: data,
          timestamp: new Date().toLocaleString(),
        })
        setConnectionInfo({
          host: data.connection.host,
          database: data.connection.database,
          user: data.connection.user,
          connected: true,
        })
        setTableStatus(data.tables || [])
      } else {
        setTestResults({
          status: "error",
          message: "Error al conectar con la base de datos",
          details: data,
          timestamp: new Date().toLocaleString(),
        })
        setConnectionInfo({
          connected: false,
          error: data.error,
        })
      }
    } catch (error) {
      setTestResults({
        status: "error",
        message: "Error al realizar la prueba",
        details: { error: error.message },
        timestamp: new Date().toLocaleString(),
      })
      setConnectionInfo({
        connected: false,
        error: error.message,
      })
    }
  }

  useEffect(() => {
    // Ejecutar la prueba automáticamente al cargar la página
    runDatabaseTest()
  }, [])

  return (
    <div className="min-h-screen bg-blue-900">
      <NewNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Prueba de Conexión a Base de Datos</h1>

          <div className="grid gap-6">
            {/* Estado de la conexión */}
            <Card className="bg-blue-800/30 border-blue-700/30 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Estado de la Conexión</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                    onClick={runDatabaseTest}
                    disabled={testResults.status === "loading"}
                  >
                    {testResults.status === "loading" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Actualizar
                  </Button>
                </div>
                <CardDescription className="text-blue-300">
                  {testResults.timestamp
                    ? `Última actualización: ${testResults.timestamp}`
                    : "No se ha ejecutado ninguna prueba"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      connectionInfo.connected ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {connectionInfo.connected ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {connectionInfo.connected ? "Conexión Establecida" : "Sin Conexión"}
                    </h3>
                    <p className="text-blue-300/70">
                      {connectionInfo.connected
                        ? `Conectado a ${connectionInfo.host || "la base de datos"}`
                        : connectionInfo.error || "No se pudo establecer conexión"}
                    </p>
                  </div>
                </div>

                {connectionInfo.connected && (
                  <div className="bg-blue-700/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-300/70">Host</p>
                      <p className="font-medium">{connectionInfo.host || "No disponible"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300/70">Base de datos</p>
                      <p className="font-medium">{connectionInfo.database || "No disponible"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300/70">Usuario</p>
                      <p className="font-medium">{connectionInfo.user || "No disponible"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300/70">Estado</p>
                      <Badge className="bg-green-600">Activo</Badge>
                    </div>
                  </div>
                )}

                {!connectionInfo.connected && connectionInfo.error && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error de conexión</AlertTitle>
                    <AlertDescription>{connectionInfo.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Estado de las tablas */}
            {connectionInfo.connected && tableStatus.length > 0 && (
              <Card className="bg-blue-800/30 border-blue-700/30 text-white">
                <CardHeader>
                  <CardTitle className="text-xl">Estado de las Tablas</CardTitle>
                  <CardDescription className="text-blue-300">
                    Verificación de tablas en la base de datos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tableStatus.map((table) => (
                      <div key={table.name} className="flex items-center justify-between p-3 bg-blue-700/30 rounded-lg">
                        <div className="flex items-center">
                          <Database className="h-5 w-5 mr-3 text-blue-300" />
                          <div>
                            <p className="font-medium">{table.name}</p>
                            {table.exists ? (
                              <p className="text-sm text-blue-300/70">
                                {table.count !== undefined ? `${table.count} registros` : "Tabla existente"}
                              </p>
                            ) : (
                              <p className="text-sm text-red-300/70">Tabla no encontrada</p>
                            )}
                          </div>
                        </div>
                        {table.exists ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detalles de la prueba */}
            <Card className="bg-blue-800/30 border-blue-700/30 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Detalles de la Prueba</CardTitle>
                <CardDescription className="text-blue-300">Información detallada de la prueba</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-blue-900/50 p-4 rounded-lg overflow-auto max-h-96 text-sm text-blue-100">
                  {JSON.stringify(testResults.details || {}, null, 2)}
                </pre>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-blue-300/70">
                  Esta información puede ser útil para diagnosticar problemas de conexión.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
