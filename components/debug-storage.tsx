"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugStorage() {
  const [storageItems, setStorageItems] = useState<Record<string, string>>({})
  const [username, setUsername] = useState<string>("")

  useEffect(() => {
    // Cargar todos los elementos de localStorage
    const loadStorage = () => {
      const items: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          items[key] = localStorage.getItem(key) || ""
        }
      }
      setStorageItems(items)
    }

    loadStorage()
  }, [])

  const handleSetUsername = () => {
    if (username) {
      localStorage.setItem("juntify_username", username)
      // Recargar los elementos de localStorage
      const items = { ...storageItems }
      items["juntify_username"] = username
      setStorageItems(items)
    }
  }

  const handleClearStorage = () => {
    localStorage.clear()
    setStorageItems({})
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Depuración de localStorage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Elementos en localStorage:</h3>
          <div className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
            <pre>{JSON.stringify(storageItems, null, 2)}</pre>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Establecer nombre de usuario:</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Nombre de usuario"
            />
            <Button onClick={handleSetUsername}>Guardar</Button>
          </div>
        </div>

        <Button variant="destructive" onClick={handleClearStorage}>
          Limpiar localStorage
        </Button>
      </CardContent>
    </Card>
  )
}
