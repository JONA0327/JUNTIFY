"use client"

import { useEffect, useState, FormEvent } from "react"
import { NewNavbar } from "@/components/new-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Edit, Trash2 } from "lucide-react"

interface Change {
  id: number
  version: string
  description: string
}

export default function JuntifyChangesPage() {
  const [changes, setChanges] = useState<Change[]>([])
  const [version, setVersion] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchChanges = async () => {
    const res = await fetch("/api/juntify-changes")
    if (res.ok) {
      const data = await res.json()
      setChanges(data)
    }
  }

  useEffect(() => {
    fetchChanges()
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!version.trim() || !description.trim()) {
      setError("Versión y descripción son requeridas")
      return
    }
    const res = await fetch("/api/juntify-changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: version.trim(), description })
    })
    if (res.ok) {
      setVersion("")
      setDescription("")
      setError("")
      fetchChanges()
    } else {
      const data = await res.json()
      setError(data.error || "Error al guardar")
    }
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId === null) return
    if (!version.trim() || !description.trim()) {
      setError("Versión y descripción son requeridas")
      return
    }
    const res = await fetch(`/api/juntify-changes/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: version.trim(), description })
    })
    if (res.ok) {
      setVersion("")
      setDescription("")
      setEditingId(null)
      setError("")
      fetchChanges()
    } else {
      const data = await res.json()
      setError(data.error || "Error al actualizar")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar cambio?")) return
    const res = await fetch(`/api/juntify-changes/${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchChanges()
    }
  }

  const startEdit = (change: Change) => {
    setEditingId(change.id)
    setVersion(change.version)
    setDescription(change.description)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setVersion("")
    setDescription("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Cambios de Juntify</h1>
          <Card className="bg-blue-800/30 border-blue-700/30 text-white">
            <CardHeader>
              <CardTitle>{editingId ? "Editar Cambio" : "Nuevo Cambio"}</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-900/40 border-red-800 text-white">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <Input
                  placeholder="Versión"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="bg-blue-900/40 border-blue-700/30 text-white"
                />
                <Textarea
                  placeholder="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-blue-900/40 border-blue-700/30 text-white"
                />
                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingId ? "Actualizar" : "Guardar"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-blue-200">
              <thead>
                <tr className="text-blue-300">
                  <th className="pb-2">Versión</th>
                  <th className="pb-2">Cambios</th>
                  <th className="pb-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((chg) => (
                  <tr key={chg.id} className="border-t border-blue-700/30">
                    <td className="py-2 align-top pr-2">{chg.version}</td>
                    <td className="py-2 align-top pr-2 whitespace-pre-wrap">{chg.description}</td>
                    <td className="py-2 space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(chg)} aria-label="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(chg.id)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <NewNavbar />
    </div>
  )
}
