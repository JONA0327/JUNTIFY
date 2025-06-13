"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  FileText,
  MessageSquare,
  ListChecks,
  Save,
  AlertCircle,
  Edit2,
  UserCheck,
  ChevronLeft,
  Calendar,
} from "lucide-react"
import { NewNavbar } from "@/components/new-navbar"
import { getUsername } from "@/utils/user-helpers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import SegmentedAudioPlayer from "@/components/segmented-audio-player"
import { audioSegmentService, type AudioSegment } from "@/utils/audio-segment-service"

interface TranscriptionItem {
  time?: string
  speaker?: string
  text: string
  id?: number
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
  transcription?: TranscriptionItem[]
  keyPoints?: { id: number; point_text: string; order_num: number }[]
  status?: string
  speakerMap?: Record<string, string>
}

export default function BuildingTranscriptionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get("id")
  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("transcription")
  const [username, setUsername] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [editingSpeaker, setEditingSpeaker] = useState<number | null>(null)
  const [speakerName, setSpeakerName] = useState("")
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({})
  const [savingSpeakers, setSavingSpeakers] = useState(false)
  const [speakerSaveSuccess, setSpeakerSaveSuccess] = useState(false)
  const [speakerSaveError, setSpeakerSaveError] = useState<string | null>(null)
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false)
  const [allSpeakers, setAllSpeakers] = useState<string[]>([])
  const [editingSpeakerKey, setEditingSpeakerKey] = useState<string>("")
  const [setupComplete, setSetupComplete] = useState(false)
  const [transcriptionOnlyView, setTranscriptionOnlyView] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [currentPlayingSegment, setCurrentPlayingSegment] = useState<string | null>(null)
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([])
  const [audioReady, setAudioReady] = useState(false)

  // Obtener el nombre de usuario al cargar la página
  useEffect(() => {
    const storedUsername = getUsername()
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  // Verificar si estamos en modo de vista de transcripción
  useEffect(() => {
    // Verificar si estamos en modo de vista de transcripción
    const viewMode = searchParams.get("view")
    if (viewMode === "transcription-only") {
      setTranscriptionOnlyView(true)
      setActiveTab("transcription")
    }
  }, [searchParams])

  // Configurar la base de datos al cargar la página
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const response = await fetch("/api/db-setup/speakers")
        const data = await response.json()
        console.log("Configuración de base de datos:", data)
        setSetupComplete(true)
      } catch (error) {
        console.error("Error al configurar la base de datos:", error)
      }
    }

    setupDatabase()
  }, [])

  // Cargar la transcripción cuando cambia el ID o el nombre de usuario
  useEffect(() => {
    if (id && username) {
      fetchTranscription()
    }
  }, [id, username])

  // Preparar el audio cuando la transcripción está lista
  useEffect(() => {
    if (transcription?.transcription && transcription.transcription.length > 0 && id && username) {
      prepareAudioSegments()
    }
  }, [transcription, id, username])

  // Configurar polling para transcripciones en proceso
  useEffect(() => {
    if (transcription?.status === "processing" && !isPolling) {
      setIsPolling(true)
      pollingIntervalRef.current = setInterval(() => {
        fetchTranscription(false)
      }, 5000) // Consultar cada 5 segundos
    }

    // Detener polling cuando la transcripción está completa
    if (transcription?.status === "completed" && isPolling) {
      setIsPolling(false)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }

    // Limpiar intervalo al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [transcription?.status, isPolling])

  // Actualizar el título editado cuando se carga la transcripción
  useEffect(() => {
    if (transcription?.title) {
      setEditedTitle(transcription.title)
    }

    // Inicializar el mapa de hablantes
    if (transcription?.speakerMap) {
      setSpeakerMap(transcription.speakerMap)
    } else if (transcription?.transcription) {
      // Crear un mapa inicial si no existe
      const initialMap: Record<string, string> = {}
      const speakers = new Set<string>()

      transcription.transcription.forEach((item) => {
        if (item.speaker) {
          speakers.add(item.speaker)
          if (!initialMap[item.speaker]) {
            initialMap[item.speaker] = item.speaker
          }
        }
      })

      setSpeakerMap(initialMap)
      setAllSpeakers(Array.from(speakers))
    }
  }, [transcription])

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      // No limpiamos la caché de audio al desmontar para mantenerla entre navegaciones
      // Solo pausamos cualquier reproducción en curso
      if (id) {
        audioSegmentService.pauseAudio(id)
      }
    }
  }, [id])

  const prepareAudioSegments = async () => {
    if (!id || !username || !transcription?.transcription) return

    // Verificar si el audio ya está en caché
    if (audioSegmentService.isAudioCached(id)) {
      setAudioReady(true)
      return
    }

    setIsAudioLoading(true)
    setAudioError(null)

    try {
      // Calcular los segmentos de audio
      const segments = transcription.transcription.map((item, index, array) => {
        // Obtener el tiempo de inicio del segmento actual
        const startTime = item.time || null

        // Obtener el tiempo de fin (que es el tiempo de inicio del siguiente segmento)
        let endTime = null
        if (index < array.length - 1) {
          endTime = array[index + 1].time || null
        }

        return {
          startTime,
          endTime,
          startSeconds: audioSegmentService.timeToSeconds(startTime),
          endSeconds: audioSegmentService.timeToSeconds(endTime),
          speakerName: item.speaker && speakerMap[item.speaker] ? speakerMap[item.speaker] : item.speaker || "Speaker",
        }
      })

      setAudioSegments(segments)

      console.log("Preparando segmentos de audio...", segments.length, "segmentos")

      // Preparar el audio con todos los segmentos
      await audioSegmentService.prepareAudio(id, username, segments)
      setAudioReady(true)
      setAudioError(null)
    } catch (error) {
      console.error("Error preparando segmentos de audio:", error)
      setAudioError(error instanceof Error ? error.message : "Error desconocido al preparar el audio")
      setAudioReady(false)
    } finally {
      setIsAudioLoading(false)
    }
  }

  const handlePlaySegment = async (segmentKey: string) => {
    if (!id) return

    // Si ya está reproduciendo este segmento, pausarlo
    if (currentPlayingSegment === segmentKey) {
      audioSegmentService.pauseAudio(id)
      setCurrentPlayingSegment(null)
      return
    }

    // Si hay otro segmento reproduciéndose, pausarlo primero
    if (currentPlayingSegment) {
      audioSegmentService.pauseAudio(id)
    }

    // Extraer tiempos del segmentKey (formato: "startTime-endTime")
    const [startTime, endTime] = segmentKey.split("-")

    // Actualizar el estado antes de intentar reproducir
    // Esto proporciona retroalimentación inmediata al usuario
    setCurrentPlayingSegment(segmentKey)

    try {
      // Reproducir el segmento con un pequeño retraso para asegurar que la UI se actualice
      setTimeout(async () => {
        const success = await audioSegmentService.playSegment(id, startTime, endTime)

        if (!success) {
          console.warn("Primer intento de reproducción falló, intentando nuevamente...")

          // Esperar un momento y volver a intentar
          setTimeout(async () => {
            const retrySuccess = await audioSegmentService.playSegment(id, startTime, endTime)

            if (!retrySuccess) {
              console.error("Reproducción falló después de reintentar")
              setCurrentPlayingSegment(null)
            }
          }, 500)
        }
      }, 100)
    } catch (error) {
      console.error("Error al reproducir segmento:", error)
      setCurrentPlayingSegment(null)
    }
  }

  const fetchTranscription = async (showLoading = true) => {
    if (!id || !username) return

    if (showLoading) {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transcription")
      }

      const data = await response.json()
      setTranscription(data)
    } catch (error) {
      console.error("Error fetching transcription:", error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const handleSaveTitle = async () => {
    if (!id || !username || !editedTitle.trim()) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editedTitle.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to update title")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Error updating title:", error)
      setSaveError("No se pudo guardar el título. Inténtalo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnalyzeTranscription = async () => {
    if (!id || !username || !transcription?.transcription) return

    setIsAnalyzing(true)
    setAnalyzeError(null)
    setAnalyzeSuccess(false)

    try {
      const response = await fetch(`/api/analyze-transcription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: id,
          transcription: transcription.transcription,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze transcription")
      }

      setAnalyzeSuccess(true)
      setTimeout(() => setAnalyzeSuccess(false), 3000)

      // Recargar la transcripción para obtener el resumen y puntos clave
      await fetchTranscription(false)
    } catch (error) {
      console.error("Error analyzing transcription:", error)
      setAnalyzeError("No se pudo analizar la transcripción. Inténtalo de nuevo.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleEditSpeaker = (speaker: string) => {
    setEditingSpeakerKey(speaker)
    setSpeakerName(speakerMap[speaker] || speaker)
    setShowSpeakerDialog(true)
  }

  const handleSaveSpeaker = async () => {
    if (!speakerName.trim() || !editingSpeakerKey) return

    // Actualizar el mapa de hablantes localmente
    const updatedMap = { ...speakerMap, [editingSpeakerKey]: speakerName.trim() }
    setSpeakerMap(updatedMap)
    setShowSpeakerDialog(false)
  }

  const handleApplySpeakerChanges = async () => {
    if (!id || !username) return

    setSavingSpeakers(true)
    setSpeakerSaveError(null)
    setSpeakerSaveSuccess(false)

    try {
      console.log("Enviando mapa de hablantes:", speakerMap)

      // Enviar la solicitud para actualizar los hablantes
      const response = await fetch(`/api/meetings/${id}/speakers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ speakerMap }),
      })

      // Leer la respuesta como texto para depuración
      const responseText = await response.text()
      console.log("Respuesta del servidor (texto):", responseText)

      // Intentar parsear la respuesta como JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Error al parsear la respuesta JSON:", e)
        throw new Error("Respuesta del servidor no válida: " + responseText)
      }

      if (!response.ok) {
        console.error("Error al guardar hablantes:", data)
        throw new Error(data.error || "Error al actualizar los hablantes")
      }

      console.log("Respuesta exitosa:", data)
      setSpeakerSaveSuccess(true)
      setTimeout(() => setSpeakerSaveSuccess(false), 3000)

      // Recargar la transcripción para obtener los cambios actualizados
      await fetchTranscription(false)
    } catch (error) {
      console.error("Error al actualizar hablantes:", error)
      setSpeakerSaveError(
        error instanceof Error
          ? `No se pudieron guardar los cambios: ${error.message}`
          : "No se pudieron guardar los cambios de hablantes. Inténtalo de nuevo.",
      )
    } finally {
      // Asegurarse de que el estado de carga se restablezca siempre
      setSavingSpeakers(false)
    }
  }

  const renderTranscriptionContent = () => {
    if (!transcription?.transcription || transcription.transcription.length === 0) {
      return (
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-blue-400" />
          <h3 className="mt-2 text-sm font-semibold text-white">No hay contenido de transcripción</h3>
          <p className="mt-1 text-sm text-blue-300">La transcripción puede estar en proceso o no disponible.</p>
        </div>
      )
    }

    // Calcular los tiempos de inicio y fin para cada segmento
    const segmentsWithTimes = transcription.transcription.map((item, index, array) => {
      // Obtener el tiempo de inicio del segmento actual
      const startTime = item.time || null

      // Obtener el tiempo de fin (que es el tiempo de inicio del siguiente segmento)
      let endTime = null
      if (index < array.length - 1) {
        endTime = array[index + 1].time || null
      }

      return {
        ...item,
        startTime,
        endTime,
        segmentKey: `${startTime}-${endTime}`,
      }
    })

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Transcripción</h3>
          <Button
            onClick={handleApplySpeakerChanges}
            disabled={savingSpeakers}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {savingSpeakers ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Aplicar cambios de hablantes
              </>
            )}
          </Button>
        </div>

        {speakerSaveSuccess && (
          <Alert className="mb-4 bg-green-800/30 border-green-700/50">
            <AlertDescription>Nombres de hablantes actualizados correctamente</AlertDescription>
          </Alert>
        )}

        {speakerSaveError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{speakerSaveError}</AlertDescription>
          </Alert>
        )}

        {audioError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{audioError}</AlertDescription>
          </Alert>
        )}

        {isAudioLoading && (
          <Alert className="mb-4 bg-blue-800/30 border-blue-700/50">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <AlertDescription>Cargando audio para la transcripción...</AlertDescription>
          </Alert>
        )}

        {segmentsWithTimes.map((item, index) => (
          <div key={index} className="p-3 bg-blue-800/20 rounded-lg border border-blue-700/30">
            <div className="flex items-center mb-2">
              <Badge variant="outline" className="text-blue-300 border-blue-600/50">
                {item.speaker && speakerMap[item.speaker] ? speakerMap[item.speaker] : item.speaker || "Speaker"}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 ml-2 text-blue-400"
                onClick={() => handleEditSpeaker(item.speaker || "")}
              >
                <Edit2 className="h-3 w-3" />
              </Button>

              {/* Reproductor de audio segmentado */}
              {id && username && item.startTime && (
                <div className="ml-2">
                  <SegmentedAudioPlayer
                    meetingId={id}
                    username={username}
                    startTime={item.startTime}
                    endTime={item.endTime}
                    speakerName={
                      item.speaker && speakerMap[item.speaker] ? speakerMap[item.speaker] : item.speaker || "Speaker"
                    }
                    isLoading={isAudioLoading}
                    error={audioError}
                    segmentKey={item.segmentKey}
                    currentPlayingSegment={currentPlayingSegment}
                    onPlaySegment={handlePlaySegment}
                  />
                </div>
              )}
            </div>
            <p className="text-blue-100">{item.text}</p>
          </div>
        ))}
      </div>
    )
  }

  const renderSummaryContent = () => {
    if (!transcription?.summary) {
      return (
        <div className="text-center py-10">
          <MessageSquare className="mx-auto h-12 w-12 text-blue-400" />
          <h3 className="mt-2 text-sm font-semibold text-white">No hay resumen disponible</h3>
          <p className="mt-1 text-sm text-blue-300">Genera un resumen analizando la transcripción con IA.</p>
          <div className="mt-6">
            <Button
              onClick={handleAnalyzeTranscription}
              disabled={isAnalyzing || !transcription?.transcription}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar transcripción"
              )}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 bg-blue-800/20 rounded-lg border border-blue-700/30">
        <h3 className="text-lg font-semibold mb-3 text-white">Resumen</h3>
        <p className="text-blue-100 whitespace-pre-line">{transcription.summary}</p>
      </div>
    )
  }

  const renderKeyPointsContent = () => {
    if (!transcription?.keyPoints || transcription.keyPoints.length === 0) {
      return (
        <div className="text-center py-10">
          <ListChecks className="mx-auto h-12 w-12 text-blue-400" />
          <h3 className="mt-2 text-sm font-semibold text-white">No hay puntos clave disponibles</h3>
          <p className="mt-1 text-sm text-blue-300">Genera puntos clave analizando la transcripción con IA.</p>
          <div className="mt-6">
            <Button
              onClick={handleAnalyzeTranscription}
              disabled={isAnalyzing || !transcription?.transcription}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar transcripción"
              )}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Puntos clave</h3>
        <ul className="space-y-3">
          {transcription.keyPoints
            .sort((a, b) => a.order_num - b.order_num)
            .map((point) => (
              <li key={point.id} className="p-3 bg-blue-800/20 rounded-lg border border-blue-700/30">
                <p className="text-blue-100">{point.point_text}</p>
              </li>
            ))}
        </ul>
      </div>
    )
  }

  // Formatear la fecha correctamente
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (error) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900">
        <main className="container mx-auto px-4 pb-24 pt-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-64 bg-blue-700/40" />
            </div>
            <Card className="bg-blue-800/20 border-blue-700/30">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-blue-700/40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full bg-blue-700/40" />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex-grow mb-4 md:mb-0 mr-4">
              <div className="flex items-center">
                {transcriptionOnlyView ? (
                  <h1 className="text-2xl font-bold text-white">{editedTitle}</h1>
                ) : (
                  <Textarea
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto resize-none text-white"
                    style={{ minHeight: "2.5rem" }}
                  />
                )}
                {!transcriptionOnlyView && (
                  <Button
                    onClick={handleSaveTitle}
                    disabled={isSaving || editedTitle.trim() === transcription?.title}
                    size="sm"
                    className="ml-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {saveError && <p className="text-red-400 text-sm mt-1">{saveError}</p>}
              {saveSuccess && <p className="text-green-400 text-sm mt-1">Título guardado correctamente</p>}
            </div>

            {transcription?.date && (
              <div className="flex items-center text-sm text-blue-300">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(transcription.date)}</span>
              </div>
            )}
          </div>

          {transcription?.status === "processing" && (
            <Alert className="mb-6 bg-blue-800/30 border-blue-700/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transcripción en proceso</AlertTitle>
              <AlertDescription>
                La transcripción está siendo procesada. El contenido se actualizará automáticamente cuando esté listo.
              </AlertDescription>
            </Alert>
          )}

          {transcriptionOnlyView && (
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="border-blue-700/30 text-blue-300"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver a Reuniones
              </Button>
            </div>
          )}

          {analyzeError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{analyzeError}</AlertDescription>
            </Alert>
          )}

          {analyzeSuccess && (
            <Alert className="mb-6 bg-green-800/30 border-green-700/50">
              <AlertDescription>Transcripción analizada correctamente</AlertDescription>
            </Alert>
          )}

          {transcriptionOnlyView ? (
            <Card className="mt-4 bg-blue-800/20 border-blue-700/30">
              <CardContent className="p-6">{renderTranscriptionContent()}</CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="transcription" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-blue-800/30 border border-blue-700/30">
                <TabsTrigger value="transcription" className="data-[state=active]:bg-blue-700">
                  Transcripción
                </TabsTrigger>
                <TabsTrigger value="summary" className="data-[state=active]:bg-blue-700">
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="keyPoints" className="data-[state=active]:bg-blue-700">
                  Puntos clave
                </TabsTrigger>
              </TabsList>
              <Card className="mt-4 bg-blue-800/20 border-blue-700/30">
                <CardContent className="p-6">
                  <TabsContent value="transcription" className="mt-0">
                    {renderTranscriptionContent()}
                  </TabsContent>
                  <TabsContent value="summary" className="mt-0">
                    {renderSummaryContent()}
                  </TabsContent>
                  <TabsContent value="keyPoints" className="mt-0">
                    {renderKeyPointsContent()}
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          )}
        </div>
      </main>

      <Dialog open={showSpeakerDialog} onOpenChange={setShowSpeakerDialog}>
        <DialogContent className="bg-blue-800 border-blue-700 text-white">
          <DialogHeader>
            <DialogTitle>Editar nombre de hablante</DialogTitle>
            <DialogDescription className="text-blue-300">
              Cambia el nombre del hablante para que sea más fácil identificarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Nombre del hablante"
              className="bg-blue-700/40 border-blue-600/50 text-white"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSpeakerDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSpeaker} disabled={!speakerName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewNavbar />
    </div>
  )
}
