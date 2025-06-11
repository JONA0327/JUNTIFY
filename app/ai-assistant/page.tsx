"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import { Search, Calendar, Clock, Users, ChevronDown, MessageSquare, Plus, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { addUsernameToHeaders } from "@/utils/user-helpers"
import Link from "next/link"
import { AIChatModal } from "@/components/ai-chat-modal"
import { NewContainerModal } from "@/components/new-container-modal"
import { ContainerPanel } from "@/components/container-panel"

// Componente para el selector de rango de fechas
const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-blue-200">Fecha inicial</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-blue-300" />
          </div>
          <input
            type="date"
            value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
            onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : null)}
            className="pl-10 w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-blue-200">Fecha final</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-blue-300" />
          </div>
          <input
            type="date"
            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : null)}
            className="pl-10 w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
          />
        </div>
      </div>
    </div>
  )
}

// Componente para la tarjeta de transcripción
const TranscriptionCard = ({ meeting, onClick, isSelected, creationMode, onToggle }) => {
  // Formatear la fecha
  const formattedDate = meeting.date
    ? format(new Date(meeting.date), "dd MMM yyyy", { locale: es })
    : "Fecha desconocida"

  // Extraer la hora de la fecha
  const meetingTime = meeting.date ? format(new Date(meeting.date), "HH:mm") : "--:--"

  // Usar la duración si está disponible, o un valor por defecto
  const duration = meeting.duration || "00:00"

  // Usar el número de participantes si está disponible, o un valor por defecto
  const participants = meeting.participants || 0

  // Extraer palabras clave si están disponibles
  const keywords = meeting.keywords || []

  return (
    <motion.div
      className={`border ${isSelected ? "border-blue-500" : "border-blue-700/30"} rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
        isSelected ? "bg-blue-700/40" : "bg-blue-800/30 hover:bg-blue-700/30"
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => (creationMode ? onToggle(meeting.id) : onClick(meeting))}
    >
      <div className="flex items-start">
        {creationMode && (
          <input
            type="checkbox"
            className="mr-2 mt-1"
            checked={isSelected}
            onChange={() => onToggle(meeting.id)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2 line-clamp-2">
          {meeting.title}
        </h3>
      </div>
      <div className="flex items-center text-blue-200/70 text-xs sm:text-sm mb-1 sm:mb-2">
        <Calendar className="h-4 w-4 mr-1" />
        <span className="mr-3">{formattedDate}</span>
        <Clock className="h-4 w-4 mr-1" />
        <span>
          {meetingTime} ({duration})
        </span>
      </div>
      <div className="flex items-center text-blue-200/70 text-xs sm:text-sm mb-2 sm:mb-3">
        <Users className="h-4 w-4 mr-1" />
        <span>{participants} participantes</span>
      </div>
      {keywords && keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {keywords.map((keyword, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-blue-600/30 text-blue-200 text-xs rounded-full">
              {keyword}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function AIAssistantPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [meetings, setMeetings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreatingContainer, setIsCreatingContainer] = useState(false)
  const [showContainerModal, setShowContainerModal] = useState(false)
  const [selectedForContainer, setSelectedForContainer] = useState<number[]>([])

  // Cargar las reuniones del usuario
  useEffect(() => {
    const fetchMeetings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/meetings", {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) {
          throw new Error("Error al cargar las reuniones")
        }

        const data = await response.json()
        setMeetings(data)
      } catch (error) {
        console.error("Error al cargar las reuniones:", error)
        setError("No se pudieron cargar las reuniones. Por favor, inténtalo de nuevo más tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  // Función para seleccionar una reunión y mostrar el modal
  const handleSelectMeeting = (meeting) => {
    setSelectedMeeting(meeting)
    setShowChatModal(true)
  }

  const toggleSelectForContainer = (id: number) => {
    setSelectedForContainer((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  const handleCreateContainer = async (name: string) => {
    if (selectedForContainer.length === 0) return
    try {
      const response = await fetch("/api/containers", {
        method: "POST",
        headers: addUsernameToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        const created = await response.json()
        for (const meetingId of selectedForContainer) {
          await fetch(`/api/containers/${created.id}/meetings`, {
            method: "POST",
            headers: addUsernameToHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ meetingId }),
          })
        }
      }
    } catch (err) {
      console.error("Error creando contenedor", err)
    } finally {
      setIsCreatingContainer(false)
      setSelectedForContainer([])
      setShowContainerModal(false)
    }
  }

  // Filtrar reuniones según los criterios de búsqueda
  const filteredMeetings = meetings.filter((meeting) => {
    // Filtrar por término de búsqueda
    const matchesSearchTerm =
      searchTerm === "" ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.summary && meeting.summary.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtrar por rango de fechas
    const meetingDate = meeting.date ? new Date(meeting.date) : null
    const matchesDateRange =
      (!startDate || (meetingDate && meetingDate >= startDate)) && (!endDate || (meetingDate && meetingDate <= endDate))

    return matchesSearchTerm && matchesDateRange
  })

  // Ordenar reuniones por fecha (más recientes primero)
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0)
    const dateB = b.date ? new Date(b.date) : new Date(0)
    return dateB - dateA
  })

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-3 sm:px-4 pb-24 pt-6 sm:pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 glow-text">Asistente IA</h1>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-4 sm:mb-8 bg-blue-800/30 border border-blue-700/30 rounded-lg p-3 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Búsqueda por término */}
              <div className="col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    type="text"
                    placeholder="Buscar por título o contenido..."
                    className="pl-10 w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                {/* Filtro por rango de fechas */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30 w-full sm:w-auto"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Rango de fechas
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-blue-800/90 border border-blue-700/50 p-4 w-72">
                    <DateRangeSelector
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                    />
                    <div className="flex justify-between mt-4">
                      <Button
                        variant="ghost"
                        className="text-blue-300 hover:text-blue-100"
                        onClick={() => {
                          setStartDate(null)
                          setEndDate(null)
                        }}
                      >
                        Limpiar
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          // Cerrar el popover (en una implementación real)
                        }}
                      >
                        Aplicar filtros
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            {!isCreatingContainer ? (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsCreatingContainer(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo contenedor
              </Button>
            ) : (
              <>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowContainerModal(true)}
                >
                  Guardar contenedor
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingContainer(false)
                    setSelectedForContainer([])
                  }}
                >
                  Cancelar
                </Button>
              </>
            )}
            <ContainerPanel />
          </div>

          {/* Estado de carga */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-center">
              <p className="text-white">{error}</p>
            </div>
          )}

          {/* Grid de transcripciones */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {sortedMeetings.length > 0 ? (
                sortedMeetings.map((meeting) => (
                  <TranscriptionCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={handleSelectMeeting}
                    isSelected={isCreatingContainer ? selectedForContainer.includes(meeting.id) : selectedMeeting?.id === meeting.id}
                    creationMode={isCreatingContainer}
                    onToggle={toggleSelectForContainer}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="rounded-full bg-blue-800/40 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-blue-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-1 sm:mb-2">
                    No hay transcripciones disponibles
                  </h3>
                  <p className="text-blue-300/70 max-w-md text-sm sm:text-base px-4">
                    Para interactuar con el asistente AI, primero debes crear algunas transcripciones de reuniones.
                  </p>
                  <Link href="/new-meeting">
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva reunión
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de chat con IA */}
      <AnimatePresence>
        {showChatModal && selectedMeeting && (
          <AIChatModal
            meeting={selectedMeeting}
            onClose={() => {
              setShowChatModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {showContainerModal && (
        <NewContainerModal
          onCancel={() => setShowContainerModal(false)}
          onCreate={handleCreateContainer}
        />
      )}

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
