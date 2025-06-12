"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { CalendarIcon, Search, ChevronLeft, ChevronRight, FileText, Loader2, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import { useDevice } from "@/hooks/use-device"
import { NewNavbar } from "@/components/new-navbar"
import { getUsername } from "@/utils/user-helpers"

interface TranscriptionItem {
  time?: string
  speaker?: string
  text: string
}

interface Transcription {
  id: number
  title: string
  date: string
  created_at: string
  duration?: string | number
  participants?: number
  summary?: string
  audio_url?: string
  content?: string
  user_id?: number
  username?: string
  transcription?: TranscriptionItem[]
  keyPoints?: { id: number; point_text: string; order_num: number }[]
}

export default function TranscriptionsPage() {
  const router = useRouter()
  const { isMobile } = useDevice()
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [memberTranscriptions, setMemberTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [memberLoading, setMemberLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [memberCurrentPage, setMemberCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [memberTotalPages, setMemberTotalPages] = useState(1)
  const [date, setDate] = useState<DateRange | undefined>()
  const [username, setUsername] = useState<string | null>(null)
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
  const itemsPerPage = 10

  // Obtener el nombre de usuario al cargar la página
  useEffect(() => {
    const storedUsername = getUsername()
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  // Cargar transcripciones cuando cambian los filtros o la página
  useEffect(() => {
    if (username) {
      fetchTranscriptions()
    }
  }, [currentPage, searchTerm, date, username])

  // Cargar transcripciones de miembros cuando cambia la pestaña
  useEffect(() => {
    if (username && activeTab === "members") {
      fetchMemberTranscriptions()
    }
  }, [memberCurrentPage, searchTerm, date, username, activeTab])

  const fetchTranscriptions = async () => {
    if (!username) return

    setLoading(true)
    try {
      let url = `/api/meetings?page=${currentPage}&limit=${itemsPerPage}`

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      if (date?.from) {
        url += `&startDate=${date.from.toISOString().split("T")[0]}`
      }

      if (date?.to) {
        url += `&endDate=${date.to.toISOString().split("T")[0]}`
      }

      const response = await fetch(url, {
        headers: {
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transcriptions")
      }

      const data = await response.json()

      // Asegurarse de que data es un array
      const meetings = Array.isArray(data) ? data : []

      setTranscriptions(meetings)
      setTotalPages(Math.ceil(meetings.length / itemsPerPage))

      // Si no hay transcripción seleccionada y hay transcripciones disponibles, seleccionar la primera
      if (!selectedTranscription && meetings.length > 0) {
        setSelectedTranscription(meetings[0])
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error)
      setTranscriptions([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberTranscriptions = async () => {
    if (!username) return

    setMemberLoading(true)
    try {
      // Por ahora, usamos la misma API sin filtros adicionales
      let url = `/api/meetings?page=${memberCurrentPage}&limit=${itemsPerPage}`

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      if (date?.from) {
        url += `&startDate=${date.from.toISOString().split("T")[0]}`
      }

      if (date?.to) {
        url += `&endDate=${date.to.toISOString().split("T")[0]}`
      }

      const response = await fetch(url, {
        headers: {
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch member transcriptions")
      }

      const data = await response.json()

      // Asegurarse de que data es un array
      const meetings = Array.isArray(data) ? data : []

      setMemberTranscriptions(meetings)
      setMemberTotalPages(Math.ceil(meetings.length / itemsPerPage))
    } catch (error) {
      console.error("Error fetching member transcriptions:", error)
      setMemberTranscriptions([])
      setMemberTotalPages(1)
    } finally {
      setMemberLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setMemberCurrentPage(1)
    fetchTranscriptions()
    if (activeTab === "members") {
      fetchMemberTranscriptions()
    }
  }

  const handleViewTranscription = (id: number) => {
    router.push(`/building-transcriptions?id=${id}&view=transcription-only`)
  }

  const handleSelectTranscription = (transcription: Transcription) => {
    setSelectedTranscription(transcription)
  }

  const handleNextPage = () => {
    if (activeTab === "personal" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    } else if (activeTab === "members" && memberCurrentPage < memberTotalPages) {
      setMemberCurrentPage(memberCurrentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (activeTab === "personal" && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    } else if (activeTab === "members" && memberCurrentPage > 1) {
      setMemberCurrentPage(memberCurrentPage - 1)
    }
  }

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)
    setCurrentPage(1)
    setMemberCurrentPage(1)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSelectedTranscription(null)
    if (value === "members" && memberTranscriptions.length === 0) {
      fetchMemberTranscriptions()
    }
  }

  // Función para formatear la fecha correctamente
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (error) {
      return dateString
    }
  }

  const renderTranscriptionCard = (transcription: Transcription) => {
    const isSelected = selectedTranscription?.id === transcription.id

    return (
      <Card
        key={transcription.id}
        className={`mb-2 hover:shadow-md transition-shadow border-blue-700/30 cursor-pointer ${
          isSelected ? "bg-blue-700/30" : "bg-blue-800/20"
        }`}
        onClick={() => handleSelectTranscription(transcription)}
      >
        <CardContent className="p-3">
          <div>
            <h3 className="text-base font-semibold mb-1 text-white line-clamp-1">{transcription.title}</h3>
            <div className="text-xs text-blue-300">{formatDate(transcription.created_at || transcription.date)}</div>
            {transcription.username && (
              <div className="text-xs text-blue-300 mt-1 flex items-center">
                <User className="h-3 w-3 mr-1" />
                <span>{transcription.username}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTranscriptionList = (items: Transcription[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading && items.length === 0) {
      return Array(5)
        .fill(0)
        .map((_, index) => (
          <Card key={index} className="mb-2 bg-blue-800/20 border-blue-700/30">
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4 bg-blue-700/40" />
                <Skeleton className="h-3 w-1/2 bg-blue-700/40" />
                <Skeleton className="h-3 w-1/4 bg-blue-700/40" />
              </div>
            </CardContent>
          </Card>
        ))
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-6">
          <FileText className="mx-auto h-8 w-8 text-blue-400" />
          <h3 className="mt-2 text-sm font-semibold text-white">{emptyMessage}</h3>
        </div>
      )
    }

    return items.map(renderTranscriptionCard)
  }

  const renderTranscriptionDetail = () => {
    if (!selectedTranscription && transcriptions.length > 0) {
      // Si hay transcripciones pero ninguna seleccionada, seleccionar la primera
      setSelectedTranscription(transcriptions[0])
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      )
    }

    if (!selectedTranscription) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <FileText className="h-16 w-16 text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Selecciona una transcripción</h3>
          <p className="text-blue-300">Haz clic en una transcripción de la lista para ver sus detalles</p>
        </div>
      )
    }

    // Crear una versión limpia de la transcripción para mostrar
    const cleanTranscription = {
      ...selectedTranscription,
      participants: undefined, // Eliminar el valor de participantes que podría estar causando el problema
    }

    return (
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{cleanTranscription.title}</h2>
          <div className="text-sm text-blue-300">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {formatDate(cleanTranscription.created_at || cleanTranscription.date)}
            </div>
          </div>
        </div>

        {cleanTranscription.summary && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Resumen</h3>
            <p className="text-blue-200">{cleanTranscription.summary}</p>
          </div>
        )}

        <div className="flex justify-between mb-6">
          <Button
            onClick={() => handleViewTranscription(cleanTranscription.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ver transcripción completa
          </Button>
        </div>

        {cleanTranscription.keyPoints && cleanTranscription.keyPoints.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Puntos clave</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-200">
              {cleanTranscription.keyPoints.map((point) => (
                <li key={point.id}>{point.point_text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0 glow-text">Transcripciones</h1>
            <Button onClick={() => router.push("/new-meeting")} className="bg-blue-600 hover:bg-blue-700">
              Nueva Transcripción
            </Button>
          </div>

          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                <Input
                  type="text"
                  placeholder="Buscar transcripciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-blue-800/30 border-blue-700/30 text-white"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal border-blue-700/30 text-blue-300",
                      !date && "text-blue-300/70",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filtrar por fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </PopoverContent>
              </Popover>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Buscar
              </Button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Panel izquierdo - Lista de transcripciones */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <Tabs defaultValue="personal" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="w-full mb-4 bg-blue-800/30">
                  <TabsTrigger value="personal" className="flex-1">
                    <User className="h-4 w-4 mr-2" />
                    Mis Transcripciones
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    De Miembros
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-0">
                  <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                    {loading && transcriptions.length === 0 ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                      </div>
                    ) : (
                      renderTranscriptionList(transcriptions, loading, "No hay transcripciones personales")
                    )}
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="border-blue-700/30 text-blue-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-blue-200">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="border-blue-700/30 text-blue-300"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="members" className="mt-0">
                  <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                    {memberLoading && memberTranscriptions.length === 0 ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                      </div>
                    ) : (
                      renderTranscriptionList(memberTranscriptions, memberLoading, "No hay transcripciones de miembros")
                    )}
                  </div>

                  {/* Paginación */}
                  {memberTotalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrevPage}
                        disabled={memberCurrentPage === 1}
                        className="border-blue-700/30 text-blue-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-blue-200">
                        {memberCurrentPage} / {memberTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={memberCurrentPage === memberTotalPages}
                        className="border-blue-700/30 text-blue-300"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Panel derecho - Detalle de la transcripción */}
            <div className="w-full md:w-2/3 lg:w-3/4 bg-blue-800/20 border border-blue-700/30 rounded-lg">
              {renderTranscriptionDetail()}
            </div>
          </div>
        </div>
      </main>

      <NewNavbar />
    </div>
  )
}
