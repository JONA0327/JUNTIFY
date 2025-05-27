"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Play, Pause, Volume2, VolumeX, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TemporaryAudioPlayerProps {
  meetingId: string
  username: string
  onClose?: () => void
}

export function TemporaryAudioPlayer({ meetingId, username, onClose }: TemporaryAudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState("00:00:00")
  const [duration, setDuration] = useState("00:00:00")
  const [fileName, setFileName] = useState<string | null>(null)
  const [tempAudioUrl, setTempAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const durationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para formatear el tiempo de audio
  const formatAudioTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) {
      return "00:00:00"
    }

    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Función para actualizar el progreso del audio
  const updateAudioProgress = () => {
    if (audioRef.current) {
      if (isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
        setAudioProgress(isFinite(progress) ? progress : 0)
        setCurrentTime(formatAudioTime(audioRef.current.currentTime))

        // Si estamos cerca del final, asegurarse de que la barra llegue al 100%
        if (audioRef.current.currentTime >= audioRef.current.duration - 0.5) {
          setAudioProgress(100)
        }
      } else {
        // Si la duración no es válida, al menos mostramos el tiempo actual
        setCurrentTime(formatAudioTime(audioRef.current.currentTime))
      }
    }
  }

  // Función para descargar el archivo de audio y crear una URL temporal
  const downloadAndCreateTempUrl = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log(`Descargando audio para la reunión ${meetingId} del usuario ${username}`)

      // Primero obtenemos la información del archivo
      const infoResponse = await fetch(`/api/meetings/${meetingId}/audio-file`, {
        headers: {
          "X-Username": username,
        },
      })

      if (!infoResponse.ok) {
        throw new Error(`Error ${infoResponse.status}: No se pudo obtener información del audio`)
      }

      const infoData = await infoResponse.json()
      console.log("Información del archivo:", infoData)

      if (!infoData.success || !infoData.fileId) {
        throw new Error(infoData.error || "No se encontró el archivo de audio")
      }

      setFileName(infoData.fileName)

      // Ahora descargamos el contenido del archivo directamente
      const fileResponse = await fetch(`/api/meetings/${meetingId}/audio-direct-download`, {
        headers: {
          "X-Username": username,
        },
      })

      if (!fileResponse.ok) {
        throw new Error(`Error ${fileResponse.status}: No se pudo descargar el audio`)
      }

      // Convertir la respuesta a un blob
      const audioBlob = await fileResponse.blob()

      // Verificar que el blob tiene contenido
      if (audioBlob.size === 0) {
        throw new Error("El archivo descargado está vacío")
      }

      console.log(`Archivo descargado: ${audioBlob.size} bytes, tipo: ${audioBlob.type}`)

      // Crear una URL temporal para el blob
      const tempUrl = URL.createObjectURL(audioBlob)
      setTempAudioUrl(tempUrl)

      // Crear y configurar el elemento de audio
      const audio = new Audio()
      audioRef.current = audio

      // Agregar listeners antes de establecer la fuente
      audio.addEventListener("timeupdate", updateAudioProgress)
      audio.addEventListener("ended", () => setIsPlaying(false))
      audio.addEventListener("error", (e) => {
        console.error("Error de reproducción:", e)
        setError("Error al reproducir el audio. Intente de nuevo.")
        setIsPlaying(false)
      })

      // Manejar la carga de metadatos
      audio.addEventListener("loadedmetadata", () => {
        if (isFinite(audio.duration)) {
          setDuration(formatAudioTime(audio.duration))
          console.log(`Duración del audio: ${audio.duration}s`)
        } else {
          console.log("Duración no disponible inmediatamente, esperando...")

          // Para archivos AAC a veces la duración no se carga inmediatamente
          if (durationCheckIntervalRef.current) {
            clearInterval(durationCheckIntervalRef.current)
          }

          // Verificar la duración periódicamente
          durationCheckIntervalRef.current = setInterval(() => {
            if (isFinite(audio.duration)) {
              setDuration(formatAudioTime(audio.duration))
              console.log(`Duración del audio (retrasada): ${audio.duration}s`)
              if (durationCheckIntervalRef.current) {
                clearInterval(durationCheckIntervalRef.current)
                durationCheckIntervalRef.current = null
              }
            }
          }, 500)
        }
      })

      // Evento adicional para asegurar que tenemos la duración
      audio.addEventListener("canplaythrough", () => {
        if (isFinite(audio.duration)) {
          setDuration(formatAudioTime(audio.duration))
          console.log(`Duración confirmada: ${audio.duration}s`)
        }
      })

      // Ahora establecemos la fuente
      audio.src = tempUrl
      // Precargamos para obtener metadatos
      audio.load()

      console.log("Audio preparado para reproducción")
      setIsLoading(false)
    } catch (err) {
      console.error("Error descargando audio:", err)
      setError(err instanceof Error ? err.message : "Error al descargar el audio")
      setIsLoading(false)
    }
  }

  // Descargar el audio cuando el componente se monta
  useEffect(() => {
    if (meetingId && username) {
      downloadAndCreateTempUrl()
    }

    // Limpiar cuando el componente se desmonta
    return () => {
      if (durationCheckIntervalRef.current) {
        clearInterval(durationCheckIntervalRef.current)
        durationCheckIntervalRef.current = null
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("timeupdate", updateAudioProgress)
        audioRef.current.removeEventListener("loadedmetadata", () => {})
        audioRef.current.removeEventListener("canplaythrough", () => {})
        audioRef.current.removeEventListener("ended", () => {})
        audioRef.current.removeEventListener("error", () => {})
        audioRef.current.src = ""
      }

      // Revocar la URL temporal para liberar memoria
      if (tempAudioUrl) {
        URL.revokeObjectURL(tempAudioUrl)
      }
    }
  }, [meetingId, username])

  // Función para reproducir o pausar el audio
  const togglePlayPause = () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        // Intentar reproducir y manejar posibles errores
        audioRef.current.play().catch((err) => {
          console.error("Error playing audio:", err)
          setError("Error al reproducir el audio")
        })
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error("Error toggling audio:", error)
      setError("Error al controlar la reproducción")
    }
  }

  // Función para silenciar/activar el audio
  const toggleMute = () => {
    if (!audioRef.current) return

    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Función para reintentar la descarga
  const handleRetry = () => {
    // Limpiar el audio anterior si existe
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    // Revocar la URL temporal anterior
    if (tempAudioUrl) {
      URL.revokeObjectURL(tempAudioUrl)
      setTempAudioUrl(null)
    }

    // Reiniciar estados
    setIsPlaying(false)
    setAudioProgress(0)
    setCurrentTime("00:00:00")
    setDuration("00:00:00")

    // Intentar descargar de nuevo
    downloadAndCreateTempUrl()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mr-2" />
        <span className="text-blue-200">Descargando archivo de audio...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <p className="text-blue-300 text-sm text-center">ID de reunión: {meetingId}</p>
        <Button
          variant="outline"
          className="mt-2 border-blue-500 text-blue-300 hover:bg-blue-800/50"
          onClick={handleRetry}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (!tempAudioUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-blue-300/50 mb-4" />
        <p className="text-blue-100">No hay grabación de audio disponible para esta reunión.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-4 w-full max-w-md">
        <Button
          onClick={togglePlayPause}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full bg-blue-600 border-none text-white hover:bg-blue-700"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <div className="flex-1">
          <div className="h-2 bg-blue-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${audioProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-blue-300 mt-1">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>

        <Button onClick={toggleMute} variant="ghost" size="icon" className="text-blue-300">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>

        {tempAudioUrl && (
          <a href={tempAudioUrl} download={fileName || `audio_${meetingId}.aac`}>
            <Button variant="ghost" size="icon" className="text-blue-300">
              <Download className="h-5 w-5" />
            </Button>
          </a>
        )}
      </div>

      {fileName && (
        <div className="text-sm text-blue-300/70 text-center">
          {fileName.replace(/^\d+_/, "")} {/* Quitar el ID del nombre para mostrar */}
        </div>
      )}
    </div>
  )
}
