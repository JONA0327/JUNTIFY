"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SpeakerAudioSegmentProps {
  meetingId: string
  username: string
  startTime: string | null
  endTime: string | null
  speakerName: string
}

export default function SpeakerAudioSegment({
  meetingId,
  username,
  startTime,
  endTime,
  speakerName,
}: SpeakerAudioSegmentProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Convertir tiempo de formato "mm:ss" a segundos
  const timeToSeconds = (timeStr: string | null): number => {
    if (!timeStr) return 0

    // Manejar diferentes formatos de tiempo (mm:ss o hh:mm:ss)
    const parts = timeStr.split(":")
    if (parts.length === 2) {
      // Formato mm:ss
      return Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
    } else if (parts.length === 3) {
      // Formato hh:mm:ss
      return Number.parseInt(parts[0]) * 3600 + Number.parseInt(parts[1]) * 60 + Number.parseInt(parts[2])
    }
    return 0
  }

  // Cargar información del audio
  useEffect(() => {
    const fetchAudioInfo = async () => {
      if (!meetingId || !username) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/meetings/${meetingId}/audio-file`, {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error("No se pudo obtener la información del audio")
        }

        const data = await response.json()

        if (data.fileId) {
          // Crear URL para el archivo de Google Drive
          const driveUrl = `https://drive.google.com/uc?export=download&id=${data.fileId}`
          setAudioUrl(driveUrl)
        } else {
          throw new Error("No se encontró el ID del archivo de audio")
        }
      } catch (err) {
        console.error("Error al cargar audio:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudioInfo()
  }, [meetingId, username])

  // Configurar el audio cuando la URL esté disponible
  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Configurar eventos
    audio.addEventListener("ended", () => {
      setIsPlaying(false)
    })

    audio.addEventListener("error", () => {
      setError("Error al reproducir el audio")
      setIsPlaying(false)
    })

    return () => {
      audio.pause()
      audio.src = ""
      audio.removeEventListener("ended", () => {})
      audio.removeEventListener("error", () => {})
    }
  }, [audioUrl])

  // Manejar reproducción
  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return

    const startSeconds = timeToSeconds(startTime)
    const endSeconds = timeToSeconds(endTime)

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Establecer el tiempo de inicio
      audioRef.current.currentTime = startSeconds

      // Configurar el evento para detener en el tiempo final
      const handleTimeUpdate = () => {
        if (audioRef.current && audioRef.current.currentTime >= endSeconds) {
          audioRef.current.pause()
          setIsPlaying(false)
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate)
        }
      }

      audioRef.current.addEventListener("timeupdate", handleTimeUpdate)

      // Iniciar reproducción
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.error("Error al reproducir:", error)
          setError("No se pudo reproducir el audio")
        })
    }
  }

  // Formatear tiempo para mostrar
  const formatTimeDisplay = (timeStr: string | null): string => {
    if (!timeStr) return "--:--"
    return timeStr
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 px-2 text-blue-400">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        <span className="text-xs">Cargando</span>
      </Button>
    )
  }

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled className="h-7 px-2 text-red-400">
              <span className="text-xs">Error</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={togglePlay}
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${isPlaying ? "text-green-400" : "text-blue-400"}`}
          >
            {isPlaying ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            <span className="text-xs">{formatTimeDisplay(startTime)}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isPlaying ? "Pausar" : "Reproducir"} segmento de {speakerName}
            {startTime && endTime ? ` (${startTime} - ${endTime})` : ""}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
