"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

interface NewTaskModalProps {
  onCancel: () => void
  onSave: (task: any) => void
  currentUserName: string
  organizationMembers: { id: number; name: string }[]
  meetings: { id: number; title: string }[]
}

export function NewTaskModal({ onCancel, onSave, currentUserName, organizationMembers, meetings }: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"baja" | "media" | "alta">("media")
  const [dueDate, setDueDate] = useState<Date>(new Date()) // Inicializar con la fecha actual
  const [assignee, setAssignee] = useState(currentUserName)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null)

  // Función para interpretar posibles referencias temporales en el texto de la tarea
  const interpretDateReferences = (taskText: string) => {
    if (!taskText) return null

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Patrones comunes de fechas relativas en español
    const patterns = [
      { regex: /\bmañana\b/i, date: tomorrow },
      { regex: /\bhoy\b/i, date: today },
      { regex: /\bpróxima semana\b|la semana que viene\b/i, date: nextWeek },
      // Se pueden añadir más patrones según sea necesario
    ]

    for (const pattern of patterns) {
      if (pattern.regex.test(taskText)) {
        return pattern.date
      }
    }

    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert("Por favor, ingresa un título para la tarea")
      return
    }

    if (!dueDate) {
      alert("Por favor, selecciona una fecha límite")
      return
    }

    const suggestedDate = interpretDateReferences(title)
    if (suggestedDate && !dueDate) {
      setDueDate(suggestedDate)
      // Opcionalmente, mostrar un mensaje al usuario
      console.log("Se detectó una referencia temporal en la tarea y se sugirió una fecha límite")
    }

    // Asegurar que la fecha esté en formato YYYY-MM-DD
    const formattedDate = dueDate instanceof Date && !isNaN(dueDate.getTime()) ? format(dueDate, "yyyy-MM-dd") : null

    if (!formattedDate) {
      setErrorMessage("Por favor, selecciona una fecha límite válida")
      return
    }

    // Preparar los datos de la tarea
    const newTask = {
      text: title,
      description,
      assignee,
      dueDate: formattedDate, // Usar la fecha formateada
      priority,
      meetingId: selectedMeeting,
    }

    // Enviar la tarea para guardar
    onSave(newTask)
  }

  // Función para manejar la selección de fecha nativa
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value)
    if (!isNaN(selectedDate.getTime())) {
      setDueDate(selectedDate)
    }
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="bg-blue-600 py-4 px-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Nueva Tarea</h2>
        <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="priority" className="block text-sm font-medium text-white">
                Prioridad
              </label>
              <Select value={priority} onValueChange={(value: "baja" | "media" | "alta") => setPriority(value)}>
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
              <label className="block text-sm font-medium text-white">Fecha límite</label>
              {/* Calendario nativo para todos los dispositivos */}
              <input
                type="date"
                value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                onChange={handleNativeDateChange}
                className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="assignee" className="block text-sm font-medium text-white">
              Asignado a
            </label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="bg-blue-700/40 border border-blue-600/50 text-white">
                <SelectValue placeholder="Seleccionar miembro" />
              </SelectTrigger>
              <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                {organizationMembers.map((member) => (
                  <SelectItem key={member.id} value={member.name} className="text-white">
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting" className="block text-sm font-medium text-white">
              Asignar conversación
            </label>
            <Select
              value={selectedMeeting ? String(selectedMeeting) : ""}
              onValueChange={(val) => setSelectedMeeting(Number(val))}
            >
              <SelectTrigger className="bg-blue-700/40 border border-blue-600/50 text-white">
                <SelectValue placeholder="Seleccionar conversación" />
              </SelectTrigger>
              <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                {meetings.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)} className="text-white">
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Crear Tarea
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
