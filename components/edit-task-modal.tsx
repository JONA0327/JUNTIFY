"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, MessageSquare, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface EditTaskModalProps {
  task: any
  onCancel: () => void
  onSave: (task: any) => Promise<boolean>
  currentUser: {
    id: number
    name: string
    role: string
  }
  organizationMembers: { id: number; name: string }[]
}

interface TaskComment {
  id?: number
  task_id?: number
  author: string
  text: string
  date: string
}

export function EditTaskModal({ task, onCancel, onSave, currentUser, organizationMembers }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.text || "")
  const [description, setDescription] = useState(task.description || "")
  const [priority, setPriority] = useState<"baja" | "media" | "alta">(task.priority || "media")
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)
  const [dueDateString, setDueDateString] = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "")
  const [assignee, setAssignee] = useState(task.assignee || currentUser.name)
  const [progress, setProgress] = useState(task.progress || 0)
  const [comments, setComments] = useState<TaskComment[]>(task.comments || [])
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const isAdmin = currentUser.role === "admin"
  const isAssignee = task.assignee === currentUser.name
  const canEdit = isAdmin || isAssignee

  // Para depuración
  useEffect(() => {
    console.log("Task en EditTaskModal:", task)
    console.log("Current user:", currentUser)
  }, [task, currentUser])

  // Cargar comentarios cuando se cambia a la pestaña de comentarios
  useEffect(() => {
    if (activeTab === "comments" && task.id) {
      fetchComments()
    }
  }, [activeTab, task.id])

  // Actualizar dueDate cuando cambia dueDateString
  useEffect(() => {
    if (dueDateString) {
      // No convertimos a objeto Date para evitar problemas de zona horaria
      // Solo guardamos el string de fecha
      console.log("Fecha límite actualizada:", dueDateString)
    } else {
      setDueDate(undefined)
    }
  }, [dueDateString])

  // Función para cargar comentarios desde la API
  const fetchComments = async () => {
    if (!task.id) return

    try {
      setIsLoadingComments(true)
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "GET",
        credentials: "include", // Importante: incluir cookies en la solicitud
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error en respuesta:", response.status, errorData)
        throw new Error("Error al cargar los comentarios")
      }

      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error("Error al cargar comentarios:", error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Asegurar que el progreso sea múltiplo de 5
  const roundToFive = (value: number) => Math.round(value / 5) * 5

  const handleProgressChange = (values: number[]) => {
    setProgress(roundToFive(values[0]))
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task.id) return

    const commentData = {
      author: currentUser.name,
      text: newComment.trim(),
    }

    try {
      setIsSavingComment(true)
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        credentials: "include", // Importante: incluir cookies en la solicitud
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error en respuesta:", response.status, errorData)
        throw new Error("Error al guardar el comentario")
      }

      const savedComment = await response.json()

      // Añadir el comentario guardado a la lista
      setComments((prev) => [savedComment, ...prev])
      setNewComment("")
    } catch (error) {
      console.error("Error al añadir comentario:", error)
      setErrorMessage("No se pudo guardar el comentario. Inténtalo de nuevo.")
    } finally {
      setIsSavingComment(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!title.trim()) {
      setErrorMessage("Por favor, ingresa un título para la tarea")
      return
    }

    if (!dueDateString) {
      setErrorMessage("Por favor, selecciona una fecha límite")
      return
    }

    try {
      setIsSaving(true)

      // Usar directamente el string de fecha sin convertirlo a objeto Date
      console.log("Fecha seleccionada (string):", dueDateString)

      // Preparar los datos de la tarea actualizada con los nombres de campo correctos
      const updatedTask = {
        id: task.id,
        text: title,
        description,
        assignee,
        due_date: dueDateString, // Usar directamente el string de fecha YYYY-MM-DD
        priority,
        progress,
        completed: progress === 100 ? true : task.completed,
        meeting_id: task.meeting_id, // Mantener el meeting_id original
      }

      console.log("Enviando datos de tarea actualizada:", updatedTask)

      // Llamar a la función onSave proporcionada por el componente padre
      const success = await onSave(updatedTask)

      if (!success) {
        throw new Error("No se pudo guardar la tarea")
      }

      // Si llegamos aquí, la operación fue exitosa
      console.log("Tarea actualizada con éxito:", updatedTask)
    } catch (error) {
      console.error("Error al guardar la tarea:", error)
      setErrorMessage(`Error al guardar los cambios: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Completar la lista de miembros si está vacía
  const displayMembers = organizationMembers.length > 0 ? organizationMembers : [{ id: 1, name: currentUser.name }]

  // Formatear la fecha para mostrar
  const formatCommentDate = (dateString: string) => {
    try {
      // Intentar parsearlo como una fecha ISO
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch (error) {
      // Si falla, devolver la fecha tal cual
      return dateString
    }
  }

  return (
    <div className="h-full max-h-[85vh] overflow-auto">
      {/* Header */}
      <div className="bg-blue-600 py-3 px-4 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xl font-bold text-white">Editar Tarea</h2>
        <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-2 border-b border-blue-700/30 sticky top-[52px] z-10 bg-blue-800/90">
          <TabsList className="bg-blue-800/30">
            <TabsTrigger value="details" className="data-[state=active]:bg-blue-600">
              Detalles
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-blue-600">
              Progreso
            </TabsTrigger>
            <TabsTrigger value="comments" className="data-[state=active]:bg-blue-600">
              Comentarios {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Detalles tab */}
        <TabsContent value="details" className="p-0 m-0">
          <form className="p-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-white">
                  Título
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
                  placeholder="Ingresa el título de la tarea"
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-white">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5 min-h-[120px]"
                  placeholder="Describe la tarea en detalle"
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="priority" className="block text-sm font-medium text-white">
                    Prioridad
                  </label>
                  <Select
                    value={priority}
                    onValueChange={(value: "baja" | "media" | "alta") => setPriority(value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="bg-blue-700/40 border border-blue-600/50 text-white">
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                      <SelectItem value="baja" className="text-white">
                        Baja
                      </SelectItem>
                      <SelectItem value="media" className="text-white">
                        Media
                      </SelectItem>
                      <SelectItem value="alta" className="text-white">
                        Alta
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dueDate" className="block text-sm font-medium text-white">
                    Fecha límite (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDateString}
                    onChange={(e) => setDueDateString(e.target.value)}
                    className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
                    disabled={!canEdit}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="assignee" className="block text-sm font-medium text-white">
                  Asignado a
                </label>
                <Select
                  value={assignee}
                  onValueChange={setAssignee}
                  disabled={!isAdmin} // Solo el admin puede reasignar tareas
                >
                  <SelectTrigger className="bg-blue-700/40 border border-blue-600/50 text-white">
                    <SelectValue placeholder="Seleccionar miembro" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                    {displayMembers.map((member) => (
                      <SelectItem key={member.id} value={member.name} className="text-white">
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </TabsContent>

        {/* Progreso tab */}
        <TabsContent value="progress" className="p-4 m-0 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-white">Progreso actual</label>
                <span className="text-2xl font-bold text-white">{progress}%</span>
              </div>

              <Slider
                defaultValue={[progress]}
                value={[progress]}
                max={100}
                step={5}
                onValueChange={handleProgressChange}
                className="w-full"
                disabled={!canEdit}
              />

              <div className="flex justify-between text-xs text-blue-300/70 pt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`h-3 w-3 rounded-full ${progress === 0 ? "bg-red-500" : progress < 50 ? "bg-yellow-500" : progress < 100 ? "bg-blue-500" : "bg-green-500"}`}
                ></div>
                <span className="text-sm text-white">
                  Estado:{" "}
                  {progress === 0
                    ? "No iniciado"
                    : progress < 50
                      ? "En progreso (inicial)"
                      : progress < 100
                        ? "En progreso (avanzado)"
                        : "Completado"}
                </span>
              </div>
            </div>

            {canEdit && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                onClick={() => setProgress(100)}
                disabled={progress === 100}
              >
                Marcar como completada
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Comentarios tab */}
        <TabsContent value="comments" className="p-0 m-0">
          <div className="p-4 space-y-3">
            {/* Lista de comentarios existentes */}
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={index} className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-white">{comment.author}</p>
                      <p className="text-xs text-blue-300/70">{formatCommentDate(comment.date)}</p>
                    </div>
                    <p className="text-blue-100 text-sm">{comment.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-blue-300/70">No hay comentarios en esta tarea.</div>
              )}
            </div>

            {/* Form para añadir comentario */}
            {(isAdmin || isAssignee) && (
              <div className="pt-4 border-t border-blue-700/30 space-y-3">
                <Textarea
                  placeholder="Añadir un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-blue-700/40 border border-blue-600/50 text-white rounded-lg resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSavingComment}
                  >
                    {isSavingComment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comentar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-200 text-sm">{errorMessage}</div>
      )}

      {/* Footer con botones */}
      <div className="p-4 border-t border-blue-700/30 bg-blue-800/50 sticky bottom-0 z-10">
        <div className="flex justify-between">
          <Button
            variant="outline"
            className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={!canEdit || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
